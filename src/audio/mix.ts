import { fromMidiSharps, midi as noteMidi } from "@tonaljs/note"
import type { EQSettings, ResolvedPlayStyle } from "../utils/settings"
import {
  DEFAULT_ARPEGGIO,
  type ArpOctaves,
  type ArpPattern,
  type ArpSpeed,
  type ArpeggioOptions,
  type CustomPattern
} from "../utils/playPrefs"

/**
 * the level, timing and macro math behind playback. nothing here touches
 * Tone, so it can be tested without audio, and the player can use the
 * timing without loading the engine.
 *
 * levels are in dB. a note's level is the sum of:
 *  - the master volume (volumeToDb), on the bus
 *  - the voice's trim and the eq's compensation, on the instrument
 *  - its place in the chord (noteLevelsDb), as its velocity
 * so the voices never add up past what the bus can take, and nothing
 * here has to be clamped to stop clipping
 */

// a control's [min, default, max]. the default is where the control sits at 0
export type MacroRange = readonly [number, number, number]

// the note the pitch balance pivots on: middle C
export const PIVOT_MIDI = 60

// how long a strum takes to cross every string
export const STRUM_SECONDS = 0.2
// the gap between the notes of an arpeggio, at each speed
export const ARPEGGIO_STEPS: Readonly<Record<ArpSpeed, number>> = Object.freeze({
  slow: 0.24,
  medium: 0.14,
  fast: 0.08
})
// the gap at the default speed
export const ARPEGGIO_STEP_SECONDS = ARPEGGIO_STEPS.medium

// the level of a lone note at the pivot. leaves room for six-note chords
// to add up under full scale before the bus's compressor and limiter
export const NOTE_BASE_DB = -9

// how much louder a chord gets per doubling of its notes. a little, so a
// big chord sounds fuller than a lone note without getting much louder
const CHORD_GROWTH_DB_PER_DOUBLING = 0.75

// a note's pitch tilt never goes past these, so the lowest and highest
// notes aren't pushed or cut without limit
const TILT_MIN_DB = -12
const TILT_MAX_DB = 4

// how far the whole chord's level follows its register
const REGISTER_MIN_DB = -6
const REGISTER_MAX_DB = 1.5

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

// a note name's midi number, e.g. "C4" is 60
export function toMidi(note: string): number {
  return noteMidi(note) ?? PIVOT_MIDI
}

/**
 * the master level for the user's volume (0-100). 80 (the default) is
 * 0 dB and 100 is about +4 dB. the curve is steeper at the bottom, as
 * loudness is heard on a log scale
 */
export function volumeToDb(volume: number): number {
  if (volume <= 0) return -Infinity
  return 40 * Math.log10(volume / 80)
}

/**
 * how far to turn an instrument down to make up for the eq's boosts.
 * the biggest boost counts most, the rest a little, and cuts count for
 * nothing
 */
export function eqCompensationDb(eq: EQSettings): number {
  const boosts = [eq.low, eq.mid, eq.high].map((band) => Math.max(0, band))
  const largest = Math.max(...boosts)
  const rest = boosts.reduce((sum, boost) => sum + boost, 0) - largest
  // || 0, so a flat eq is 0 rather than -0
  return -(largest * 0.6 + rest * 0.2) || 0
}

/**
 * the pitch tilt for a balance (-5 bass forward ... 5 treble forward), in
 * dB per octave above the pivot. 0 is -3 dB an octave: high notes are
 * heard as louder than low ones at the same level, so they're turned down.
 * the treble end is about level, which the ear already hears as bright,
 * so even there the bass isn't buried
 */
export function balanceSlope(balance: number): number {
  return -3 + 0.7 * balance
}

// the lift the lowest note of a chord gets, as it carries the harmony
export function bassEmphasisDb(balance: number): number {
  return 2 - 0.3 * balance
}

/**
 * the lift the highest note of a chord of three or more gets, as it
 * carries the melody, so both outer voices stand out a little from the
 * inner ones (in a close voicing at the default balance, the top note
 * comes out just over its neighbor). it fades out toward the treble end
 * of the balance, which already favors the top, so the top note never
 * overtakes the bass
 */
export function topEmphasisDb(balance: number): number {
  return clamp(1 - 0.2 * balance, 0, 1)
}

/**
 * each note's level in a chord, relative to a lone note at the pivot.
 * - each note is tilted by its pitch, the lowest note lifted, and (with
 *   inner voices between them) the highest note lifted a little
 * - the chord is brought back to the power of about one note, so adding
 *   notes doesn't pile up level (it grows a little; see
 *   CHORD_GROWTH_DB_PER_DOUBLING)
 * - the whole chord then follows its register by half the tilt, so a
 *   chord up high doesn't sound louder than the same chord down low
 * tiltScale softens (below 1) or sharpens the tilt for a voice; samples
 * already lose some weight as they go up
 */
export function noteLevelsDb(midis: number[], balance = 0, tiltScale = 1): number[] {
  if (!midis.length) return []

  const slope = balanceSlope(balance) * tiltScale
  const lowest = Math.min(...midis)
  const highest = Math.max(...midis)
  const bass = midis.length > 1 ? bassEmphasisDb(balance) * tiltScale : 0
  const top = midis.length > 2 ? topEmphasisDb(balance) * tiltScale : 0

  const raw = midis.map((midi) =>
    clamp(slope * (midi - PIVOT_MIDI) / 12, TILT_MIN_DB, TILT_MAX_DB) +
    (midi === lowest ? bass : 0) +
    (midi === highest && midi !== lowest ? top : 0)
  )

  const power = raw.reduce((sum, db) => sum + 10 ** (db / 10), 0)
  const growth = CHORD_GROWTH_DB_PER_DOUBLING * Math.log2(midis.length)
  const normalize = -10 * Math.log10(power) + growth

  const mean = midis.reduce((sum, midi) => sum + midi, 0) / midis.length
  const register = clamp(0.5 * slope * (mean - PIVOT_MIDI) / 12, REGISTER_MIN_DB, REGISTER_MAX_DB)

  return raw.map((db) => db + normalize + register)
}

// which side of center a note is panned to: left, center or right
export type StereoSide = -1 | 0 | 1

// how far off center a side note is panned (0-1). small, so it separates
// the voices without pulling the chord apart
export const STEREO_WIDTH = 0.2
// notes below this stay in the center, as the low end does in a mix
const STEREO_MIN_MIDI = PIVOT_MIDI

/**
 * where each note of a chord sits in the stereo field. the bass and
 * everything below middle C stay centered; the notes above alternate
 * right and left from the top down, so neighbors land on opposite
 * sides. the panning is by level alone, so the chord sums to mono the
 * same as it plays in stereo
 */
export function noteSides(midis: number[]): StereoSide[] {
  const lowest = Math.min(...midis)
  const spread = midis
    .map((midi, index) => ({ midi, index }))
    .filter(({ midi }) => midi >= STEREO_MIN_MIDI && midi !== lowest)
    .sort((a, b) => b.midi - a.midi || a.index - b.index)

  const sides: StereoSide[] = midis.map(() => 0)
  spread.forEach(({ index }, rank) => {
    sides[index] = rank % 2 === 0 ? 1 : -1
  })
  return sides
}

// how far humanize moves each note's start, either way
export const HUMANIZE_SECONDS = 0.008
// how far humanize moves each note's level, either way
export const HUMANIZE_DB = 1

/**
 * loosens each note's start and level by a small random amount, the way
 * a person's playing drifts. a start can move up to HUMANIZE_SECONDS
 * early, so the chord has to be scheduled at least that far ahead.
 * random is Math.random, or a stand-in for tests
 */
export function humanize(
  timings: NoteTiming[],
  levels: number[],
  random: () => number = Math.random
): { timings: NoteTiming[]; levels: number[] } {
  const jitter = (amount: number) => (2 * random() - 1) * amount
  return {
    timings: timings.map((timing) => ({ ...timing, offset: timing.offset + jitter(HUMANIZE_SECONDS) })),
    levels: levels.map((level) => level + jitter(HUMANIZE_DB))
  }
}

// the velocity (0-1) that plays a note at a level from noteLevelsDb
export function noteVelocity(levelDb: number): number {
  return clamp(10 ** ((NOTE_BASE_DB + levelDb) / 20), 0, 1)
}

/**
 * where a control (-span ... span) puts a parameter in its range. it
 * moves from the default toward the min or max on a log scale, as
 * times and frequencies are heard, unless the range touches 0
 */
export function macro(value: number, [min, def, max]: MacroRange, span = 5): number {
  const amount = clamp(value / span, -1, 1)
  const target = amount < 0 ? min : max
  const distance = Math.abs(amount)

  if (def > 0 && target > 0) return def * (target / def) ** distance
  return def + (target - def) * distance
}

/**
 * the dry and reverb levels for the space control (0-10). the dry level
 * dips a little as the room grows, so the total stays about the same
 */
export function spaceMix(space: number): { dry: number; wet: number } {
  const amount = clamp(space / 10, 0, 1)
  return { dry: 1 - 0.3 * amount, wet: 0.9 * amount ** 1.3 }
}

export interface NoteTiming {
  // which of the chord's notes plays. an arpeggio can play one more than once
  index: number
  // seconds after the chord starts
  offset: number
  // seconds the note is held before it's released
  duration: number
}

/**
 * the order a built-in pattern plays a chord's notes in, as indexes into
 * the notes (which run low to high). the patterns that turn around don't
 * play the top or bottom note twice in a row. alberti goes back to the
 * top note between each of the others, the way the classic left-hand
 * figure does (bass, top, middle, top for a triad). random keeps the bass
 * first, so the chord stays grounded, and shuffles the rest. custom isn't
 * an order of the chord's notes, so it plays up here (see arpeggioSteps).
 * random is Math.random, or a stand-in for tests
 */
export function arpeggioOrder(count: number, pattern: ArpPattern, random: () => number = Math.random): number[] {
  const up = Array.from({ length: count }, (_, index) => index)
  const down = [...up].reverse()

  switch (pattern) {
    case "up":
    case "custom":
      return up
    case "down":
      return down
    case "updown":
      return [...up, ...down.slice(1)]
    case "downup":
      return [...down, ...up.slice(1)]
    case "converge": {
      const order: number[] = []
      for (let low = 0, high = count - 1; low <= high; low++, high--) {
        order.push(low)
        if (high !== low) order.push(high)
      }
      return order
    }
    case "alberti": {
      if (count < 3) return up
      const top = count - 1
      return up.slice(0, top).flatMap((index) => [index, top])
    }
    case "random": {
      const rest = up.slice(1)
      for (let index = rest.length - 1; index > 0; index--) {
        const swap = Math.floor(random() * (index + 1))
        const held = rest[index]
        const other = rest[swap]
        if (held === undefined || other === undefined) continue
        rest[index] = other
        rest[swap] = held
      }
      return count ? [0, ...rest] : []
    }
  }
}

// whether a custom pattern plays anything; one that's all rests plays up
const isPlayable = (pattern: CustomPattern): boolean => pattern.some((rows) => rows.length > 0)

/**
 * the steps an arpeggio plays, each the indexes of the notes that start
 * on it: none for a rest, more than one for notes struck together. a
 * custom pattern's rows are the note indexes, without the rests before its
 * first note or after its last, so a chord starts as soon as it's played
 */
export function arpeggioSteps(
  count: number,
  { pattern, custom }: Pick<ArpeggioOptions, "pattern" | "custom">,
  random: () => number = Math.random
): number[][] {
  if (pattern !== "custom" || !isPlayable(custom)) {
    return arpeggioOrder(count, pattern, random).map((index) => [index])
  }

  const steps = custom.map((rows) => rows.filter((row) => row < count))
  const first = steps.findIndex((rows) => rows.length > 0)
  const last = steps.length - 1 - [...steps].reverse().findIndex((rows) => rows.length > 0)
  return first === -1 ? [] : steps.slice(first, last + 1)
}

/**
 * the notes an arpeggio runs over: the chord's notes low to high, and,
 * over two octaves, the same notes again an octave up (leaving out any
 * the chord already has, as a guitar voicing often doubles notes)
 */
export function arpeggioNotes(notes: string[], octaves: ArpOctaves): string[] {
  const midis = [...new Set(notes.map(toMidi))]
  if (octaves === 2) {
    for (const midi of [...midis]) {
      if (!midis.includes(midi + 12)) midis.push(midi + 12)
    }
  }
  return midis.sort((a, b) => a - b).map(fromMidiSharps)
}

/**
 * fits an arpeggio's notes (low to high) to the rows a custom pattern
 * uses, one note a row. a chord with more notes than that loses its top
 * ones; one with fewer carries on up through its own notes an octave
 * higher, so a triad's fourth row is the bass an octave up. other
 * patterns keep the notes as they are
 */
export function fitArpeggioNotes(notes: string[], { pattern, custom }: Pick<ArpeggioOptions, "pattern" | "custom">): string[] {
  if (pattern !== "custom" || !isPlayable(custom) || !notes.length) return notes

  const rows = Math.max(...custom.flat()) + 1
  const midis = notes.slice(0, rows).map(toMidi)
  for (let row = midis.length; row < rows; row++) {
    let midi = toMidi(notes[row % notes.length] ?? "")
    const below = midis[row - 1] ?? -Infinity
    while (midi <= below) midi += 12
    midis.push(midi)
  }
  return midis.map(fromMidiSharps)
}

/**
 * when each note starts and how long it's held, for a chord played
 * together, strummed, or as an arpeggio. an arpeggio's notes ring on
 * until its last note ends, so they release together, or until the
 * same note comes round again. played separate, every note lasts a
 * step, the last too, so a rest is heard as one and nothing is left
 * holding on; the voice's release fades each one out
 */
export function noteTimings(
  count: number,
  style: ResolvedPlayStyle,
  hold: number,
  arpeggio: ArpeggioOptions = DEFAULT_ARPEGGIO,
  random: () => number = Math.random
): NoteTiming[] {
  if (style === "r") return arpeggioTimings(count, hold, arpeggio, random)

  return Array.from({ length: count }, (_, index) => style === "s"
    ? { index, offset: index * (STRUM_SECONDS / count), duration: hold }
    : { index, offset: 0, duration: hold }
  )
}

function arpeggioTimings(
  count: number,
  hold: number,
  arpeggio: ArpeggioOptions,
  random: () => number
): NoteTiming[] {
  const step = ARPEGGIO_STEPS[arpeggio.speed]
  const steps = arpeggioSteps(count, arpeggio, random)
  const last = steps.length - 1
  const end = last * step + hold

  return steps.flatMap((indexes, position) => indexes.map((index) => {
    const offset = position * step
    if (arpeggio.sustain === "separate") return { index, offset, duration: Math.min(step, hold) }
    const again = steps.findIndex((later, laterPosition) => laterPosition > position && later.includes(index))
    return { index, offset, duration: (again === -1 ? end : again * step) - offset }
  }))
}

/**
 * the steps one cycle of a looping arpeggio plays. the patterns that turn
 * around leave off their last note, which the next cycle starts on, so
 * the bass (or top) isn't played twice in a row. a custom pattern keeps
 * its rests, so its rhythm holds from cycle to cycle, but starts on its
 * first note: rests before that go round to the end
 */
export function loopSteps(
  count: number,
  { pattern, custom }: Pick<ArpeggioOptions, "pattern" | "custom">,
  random: () => number = Math.random
): number[][] {
  if (pattern === "custom" && isPlayable(custom)) {
    const steps = custom.map((rows) => rows.filter((row) => row < count))
    const first = steps.findIndex((rows) => rows.length > 0)
    return first === -1 ? [] : [...steps.slice(first), ...steps.slice(0, first)]
  }

  const steps = arpeggioSteps(count, { pattern, custom }, random)
  return (pattern === "updown" || pattern === "downup") && count > 1 ? steps.slice(0, -1) : steps
}

export interface LoopCycle {
  timings: NoteTiming[]
  // seconds from the cycle's start to the next one's
  length: number
}

/**
 * one cycle of a looping arpeggio. rung, each note holds until it's
 * played again, in this cycle or the next, so the chord keeps sounding
 * the way it would with the pedal down; separate, each lasts a step.
 * empty when there's nothing to play
 */
export function loopCycle(
  count: number,
  hold: number,
  arpeggio: ArpeggioOptions,
  random: () => number = Math.random
): LoopCycle {
  const step = ARPEGGIO_STEPS[arpeggio.speed]
  const steps = loopSteps(count, arpeggio, random)
  const total = steps.length

  const timings = steps.flatMap((indexes, position) => indexes.map((index) => {
    const offset = position * step
    if (arpeggio.sustain === "separate") return { index, offset, duration: Math.min(step, hold) }

    // the next step that plays this note, going round into the next cycle
    let gap = 1
    while (gap < total && !steps[(position + gap) % total]?.includes(index)) gap++
    return { index, offset, duration: gap * step }
  }))

  return { timings, length: total * step }
}

// seconds from a chord's first note to its last
export function playSpanSeconds(
  count: number,
  style: ResolvedPlayStyle,
  arpeggio: ArpeggioOptions = DEFAULT_ARPEGGIO
): number {
  return noteTimings(count, style, 0, arpeggio).reduce((latest, timing) => Math.max(latest, timing.offset), 0)
}
