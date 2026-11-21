import * as Tone from "tone"
import { getBus } from "./bus"
import { Voice, getVoiceDef } from "./voices"
import {
  eqCompensationDb,
  humanize,
  macro,
  noteLevelsDb,
  noteSides,
  noteTimings,
  noteVelocity,
  toMidi,
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
  // the pattern, speed and sustain of an arpeggio
  arpeggio: ArpeggioOptions
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

/**
 * plays the notes on the instrument, shaped by the sound settings. each
 * note's level and place in the stereo field come from mix.ts, so chords
 * stay clean and low notes aren't buried under high ones
 */
export async function playNotes(request: PlayRequest): Promise<void> {
  const { eq, sound, style, notes, arpeggio, volume, delay } = request
  if (!notes.length) return

  const { key, voice } = await getVoice(request.instrument)
  const def = getVoiceDef(key)

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
  const shaped = {
    levels: noteLevelsDb(midis, sound.balance, def.tiltScale),
    timings: noteTimings(notes.length, style, macro(sound.length, def.hold), arpeggio)
  }
  const { levels, timings } = request.humanize ? humanize(shaped.timings, shaped.levels) : shaped
  const sides = noteSides(midis)
  const start = Tone.now() + delay

  // a new chord takes over from the last
  voice.releaseAll()

  // an arpeggio can play a note more than once; each time keeps the
  // note's own level and side
  timings.forEach(({ index, offset, duration }) => {
    const note = notes[index]
    if (note === undefined) return
    voice.play(note, duration, start + offset, noteVelocity(levels[index] ?? 0), sides[index] ?? 0)
  })

  bus.watchLevels()
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
