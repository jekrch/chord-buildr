import * as Tone from "tone"
import { getBus } from "./bus"
import { Voice, getVoiceDef } from "./voices"
import {
  ARPEGGIO_STEPS,
  eqCompensationDb,
  humanize,
  loopCycle,
  macro,
  type NoteTiming,
  noteLevelsDb,
  noteSides,
  noteTimings,
  noteVelocity,
  toMidi,
  type StereoSide,
  volumeToDb
} from "./mix"
import { SYNTH_TYPES, SynthKey } from "../utils/synthTypes"
import type { EQSettings, ResolvedPlayStyle, SoundSettings } from "../utils/settings"
import type { ArpeggioOptions } from "../utils/playPrefs"

/**
 * the only module (with the bus and voices it loads) that imports Tone.
 * the player loads it with import() on the first user gesture or the
 * first play, so Tone stays out of the main bundle and no AudioContext is
 * created before the page is interacted with
 */

export interface PlayRequest {
  // a SYNTH_TYPES key
  instrument: SynthKey
  eq: EQSettings
  sound: SoundSettings
  // how the notes are played, with auto already resolved
  style: ResolvedPlayStyle
  // note names, such as "C#4", in the order they're strummed. an
  // arpeggio's run low to high, and the pattern picks the order
  notes: string[]
  // the pattern, speed and sustain of an arpeggio, and whether it loops
  arpeggio: ArpeggioOptions
  // when a loop is already running on the same instrument, have this one
  // take over at the start of its next cycle rather than straight away,
  // so a change to a looping chord doesn't break its rhythm
  handover?: boolean
  // loosen each note's timing and level a little
  humanize: boolean
  // 0-100
  volume: number
  // seconds from now. at least HUMANIZE_SECONDS when humanized
  delay: number
}

// the voice played when another can't be loaded
const FALLBACK: SynthKey = "p"

// voices that are loaded or loading, by instrument
const voices: Partial<Record<SynthKey, Promise<Voice>>> = {}

/**
 * starts the audio context. browsers only allow that after a user
 * gesture, so it's called from one, and again before each play
 */
export function resumeAudio(): Promise<void> {
  if (Tone.getContext().state === "running") return Promise.resolve()
  return Tone.start()
}

// how far past Tone.now() (which already runs Tone's lookahead ahead of
// the audio clock) a loop's notes are handed to the voice. a stop can't
// take back what's been handed over, so it's kept short; it only has to
// cover the gap between ticks
const LOOP_AHEAD_SECONDS = 0.05
// how often a loop looks for notes coming due. Tone's clock ticks about
// every 50ms, so this is as often as it can
const LOOP_TICK_SECONDS = 0.025

// what a chord's notes are played with, worked out once a play
interface PreparedNotes {
  notes: string[]
  levels: number[]
  sides: StereoSide[]
  // seconds a note is held, from the length control
  hold: number
  arpeggio: ArpeggioOptions
  humanize: boolean
}

// one cycle of a loop, ready to schedule
interface ScheduledCycle {
  timings: NoteTiming[]
  levels: number[]
  length: number
  // seconds between its steps: the loop's beat
  step: number
}

// a note a loop has struck and not yet released
interface SoundingNote {
  note: string
  side: StereoSide
  // context times
  attackAt: number
  releaseAt: number
}

interface Loop {
  key: SynthKey
  voice: Voice
  prepared: PreparedNotes
  // a handover waiting for the next cycle
  next?: PreparedNotes
  // the context time the current cycle started at
  cycleStart: number
  cycle: ScheduledCycle
  // the next of the cycle's timings to hand to the voice
  cursor: number
  // no note is struck before this context time: the beat the loop came
  // in on, so a humanized note can't creep in ahead of the chord change
  notBefore: number
  // the context time notes have been handed to the voice up to
  handedUntil: number
  // by note name; a loop ends each note itself, so it can end them all
  // on a chord change or a stop
  sounding: Map<string, SoundingNote>
  timer: number
}

let loop: Loop | undefined
// counts plays and stops, so a loop that finishes loading after a newer
// play or a stop doesn't start
let playCount = 0

/**
 * plays the notes on the instrument, shaped by the sound settings. each
 * note's level and place in the stereo field come from mix.ts, so chords
 * stay clean and low notes aren't buried under high ones. a looping
 * arpeggio keeps playing until stopNotes or the next play
 */
export async function playNotes(request: PlayRequest): Promise<void> {
  const { eq, sound, style, notes, arpeggio, volume, delay } = request
  const count = ++playCount
  const loops = style === "r" && arpeggio.loop
  const known = SYNTH_TYPES[request.instrument] ? request.instrument : FALLBACK

  if (!notes.length) {
    stopLoop(Tone.now())
    return
  }

  // a loop on the same instrument hands over: at its next cycle for a
  // handover, or on its next beat for another chord, so the pulse holds.
  // anything else ends a running loop now, before a voice it might be
  // using is swapped out
  const handingOver = loops && request.handover === true && loop?.key === known
  const onTheBeat = loops && !handingOver && loop?.key === known
  if (!handingOver && !onTheBeat) stopLoop(Tone.now())

  const { key, voice } = await getVoice(request.instrument)
  const def = getVoiceDef(key)
  // a newer play or a stop came while the voice loaded
  if (count !== playCount && loops) return

  resumeAudio().catch((error: unknown) => console.warn('failed to resume audio:', error))

  voice.setEnvelope({
    attack: macro(sound.attack, def.attack),
    decay: macro(sound.length, def.decay),
    release: macro(sound.length, def.release)
  })
  voice.volume.rampTo(def.trimDb + eqCompensationDb(eq), 0.02)

  const bus = getBus()
  bus.apply({
    eq,
    cutoff: macro(sound.tone, def.tone),
    space: sound.space,
    volumeDb: volumeToDb(volume)
  })

  const midis = notes.map(toMidi)
  const prepared: PreparedNotes = {
    notes,
    levels: noteLevelsDb(midis, sound.balance, def.tiltScale),
    sides: noteSides(midis),
    hold: macro(sound.length, def.hold),
    arpeggio,
    humanize: request.humanize
  }

  if (handingOver && loop?.key === key) {
    loop.next = prepared
    return
  }

  bus.open(Tone.now())

  // another chord comes in on the running loop's next beat, at the same
  // place in the bar, so the meter carries on through the change. every
  // note of the last chord is released on that beat, so they don't overlap
  const running = onTheBeat && loop?.key === key ? loop : undefined
  if (running) {
    const beat = nextBeat(running)
    const { cycleStart, cycle } = running
    // where that beat falls in the running bar; its next downbeat is 0
    const barBeats = Math.max(1, Math.round(cycle.length / cycle.step))
    const intoBar = Math.round((beat - cycleStart) / cycle.step) % barBeats
    stopLoop(beat)
    startLoop(key, voice, prepared, beat, intoBar)
    bus.watchLevels()
    return
  }
  stopLoop(Tone.now())

  const start = Tone.now() + delay
  // a new chord takes over from the last
  voice.releaseAll()

  if (loops) {
    startLoop(key, voice, prepared, start, 0)
  } else {
    const shaped = {
      levels: prepared.levels,
      timings: noteTimings(notes.length, style, prepared.hold, arpeggio)
    }
    const { levels, timings } = request.humanize ? humanize(shaped.timings, shaped.levels) : shaped

    // an arpeggio can play a note more than once; each time keeps the
    // note's own level and side
    timings.forEach(({ index, offset, duration }) => {
      const note = notes[index]
      if (note === undefined) return
      voice.play(note, duration, start + offset, noteVelocity(levels[index] ?? 0), prepared.sides[index] ?? 0)
    })
  }

  bus.watchLevels()
}

/**
 * stops what's playing: ends a loop, and fades out the notes still
 * sounding (the reverb's tail rings on)
 */
export function stopNotes(): void {
  playCount++
  const now = Tone.now()
  const running = loop
  stopLoop(now)
  getBus().silence(now)
  running?.voice.releaseAll()
}

// whether a loop is playing
export function isLooping(): boolean {
  return loop !== undefined
}

// a cycle of the loop's pattern, loosened if it's humanized. random
// patterns are shuffled afresh each cycle
function scheduleCycle(prepared: PreparedNotes): ScheduledCycle {
  const { timings, length } = loopCycle(prepared.notes.length, prepared.hold, prepared.arpeggio)
  const shaped = prepared.humanize ? humanize(timings, prepared.levels) : { timings, levels: prepared.levels }
  return { ...shaped, length, step: ARPEGGIO_STEPS[prepared.arpeggio.speed] }
}

/**
 * the loop's next beat that nothing has been handed to the voice for
 * yet, counting from the start of its cycle, so whatever comes in there
 * keeps time with it
 */
function nextBeat({ cycleStart, cycle, handedUntil }: Loop): number {
  const from = Math.max(handedUntil, Tone.now())
  // a hair over, so a beat right at the edge counts as handed
  const beats = Math.floor((from - cycleStart) / cycle.step + 1e-6) + 1
  return cycleStart + Math.max(0, beats) * cycle.step
}

/**
 * starts a loop at the given context time, on the given beat of its
 * pattern: 0 from the top, or further in to pick up where the bar it's
 * taking over from had got to. a pattern shorter than that wraps round.
 * it hands its notes to the voice a little ahead of time, on Tone's
 * clock, which keeps time in a background tab where timers are slowed down
 */
function startLoop(key: SynthKey, voice: Voice, prepared: PreparedNotes, start: number, beat: number): void {
  const cycle = scheduleCycle(prepared)
  if (!cycle.timings.length || cycle.length <= 0) return

  const beats = Math.max(1, Math.round(cycle.length / cycle.step))
  const position = ((beat % beats) + beats) % beats
  // the first of the timings on or after that beat; the ones before it
  // belong to the part of the bar that's already gone by
  const cursor = cycle.timings.findIndex((timing) => Math.round(timing.offset / cycle.step) >= position)

  loop = {
    key,
    voice,
    prepared,
    cycleStart: start - position * cycle.step,
    cycle,
    cursor: cursor === -1 ? cycle.timings.length : cursor,
    notBefore: start,
    handedUntil: 0,
    sounding: new Map(),
    timer: Tone.getContext().setInterval(scheduleDueNotes, LOOP_TICK_SECONDS)
  }
  scheduleDueNotes()
}

/**
 * ends the loop, releasing its notes at the given context time (or as
 * they'd have ended anyway, if that's sooner). nothing has been struck
 * past the time it's given: see nextBeat
 */
function stopLoop(at: number): void {
  if (!loop) return
  const { voice, sounding, timer } = loop
  Tone.getContext().clearInterval(timer)
  sounding.forEach((sound) => releaseNote(voice, sound, Math.min(sound.releaseAt, at)))
  loop = undefined
}

// releases a note, never before it starts, so one handed over but not
// yet begun still ends
function releaseNote(voice: Voice, { note, side, attackAt }: SoundingNote, time: number): void {
  voice.release(note, Math.max(time, attackAt), side)
}

/**
 * hands the voice what's coming up soon, in time order: the loop's next
 * notes, and the releases of the notes sounding. it goes on into the
 * next cycle when the current one is done; a handover waiting for it
 * releases the last cycle's notes as it begins
 */
function scheduleDueNotes(): void {
  const current = loop
  if (!current) return
  const horizon = Tone.now() + LOOP_AHEAD_SECONDS
  current.handedUntil = horizon
  // the audio clock itself. a note can be set for any time from here on
  // and land exactly; only one already past (after a stall) starts late
  const { currentTime } = Tone.getContext()
  const { voice, sounding } = current

  for (;;) {
    if (current.cursor >= current.cycle.timings.length) {
      const nextStart = current.cycleStart + current.cycle.length
      if (nextStart <= horizon) {
        if (current.next) {
          current.prepared = current.next
          current.next = undefined
          sounding.forEach((sound) => {
            if (sound.releaseAt > nextStart) sound.releaseAt = nextStart
          })
        }
        current.cycleStart = nextStart
        current.cycle = scheduleCycle(current.prepared)
        current.cursor = 0
        if (!current.cycle.timings.length || current.cycle.length <= 0) {
          stopLoop(nextStart)
          return
        }
        continue
      }
    }

    const timing = current.cycle.timings[current.cursor]
    const attackAt = timing
      ? Math.max(current.cycleStart + timing.offset, current.notBefore)
      : Infinity
    let due: SoundingNote | undefined
    sounding.forEach((sound) => {
      if (!due || sound.releaseAt < due.releaseAt) due = sound
    })
    const releaseAt = due?.releaseAt ?? Infinity

    if (Math.min(attackAt, releaseAt) > horizon) return

    // a release that's due first, or at the same moment, goes first
    if (due && releaseAt <= attackAt) {
      releaseNote(voice, due, releaseAt)
      sounding.delete(due.note)
      continue
    }

    current.cursor++
    const { notes, sides } = current.prepared
    const note = timing && notes[timing.index]
    if (!timing || note === undefined) continue

    const time = Math.max(attackAt, currentTime)
    // a note struck again ends the last strike first
    const again = sounding.get(note)
    if (again) releaseNote(voice, again, time)

    const side = sides[timing.index] ?? 0
    voice.attack(note, time, noteVelocity(current.cycle.levels[timing.index] ?? 0), side)
    sounding.set(note, { note, side, attackAt: time, releaseAt: time + timing.duration })
  }
}

/**
 * the voice for an instrument, loading it (and connecting it to the bus)
 * if it isn't loaded. other synths are disposed of when one is picked,
 * as they're quick to rebuild; samplers are kept, as their samples
 * aren't. a sampler that fails to load falls back to plumber
 */
async function getVoice(key: SynthKey): Promise<{ key: SynthKey; voice: Voice }> {
  const known = SYNTH_TYPES[key] ? key : FALLBACK

  try {
    return { key: known, voice: await loadVoice(known) }
  } catch (error) {
    console.error('failed to load instrument:', error)
    delete voices[known]
    return { key: FALLBACK, voice: await loadVoice(FALLBACK) }
  }
}

function loadVoice(key: SynthKey): Promise<Voice> {
  const existing = voices[key]
  if (existing) return existing

  if (SYNTH_TYPES[key]?.type === "synth") disposeSynths()

  const loading = Promise.resolve(getVoiceDef(key).create()).then((voice) => {
    voice.output.connect(getBus().input)
    return voice
  })
  voices[key] = loading
  return loading
}

// dispose of the loaded synths, so switching voices doesn't leak audio nodes
function disposeSynths() {
  for (const [key, loading] of Object.entries(voices)) {
    if (!loading || SYNTH_TYPES[key]?.type !== "synth") continue
    delete voices[key]
    loading
      .then((voice) => voice.dispose())
      .catch((error: unknown) => console.warn(`error cleaning up synth ${key}:`, error))
  }
}
