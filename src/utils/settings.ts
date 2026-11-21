/**
 * the playback and display settings a progression is shared with. nothing
 * here touches audio or the ui, so the url codec can use it without pulling
 * either in
 */

export interface EQSettings {
  low: number    // shelf below 250 Hz
  mid: number    // 250-2500 Hz
  high: number   // shelf above 2500 Hz
}

// how a chord's notes are played. auto strums fretted formats and plays
// piano chords together
export type PlayStyle = "a" | "c" | "s" | "r"
// what auto resolves to
export type ResolvedPlayStyle = Exclude<PlayStyle, "a">

export const PLAY_STYLES: Record<PlayStyle, string> = {
  a: "auto",
  c: "chord",
  s: "strum",
  r: "arpeggio"
}

/**
 * the shape of the sound, as a few musical controls. each voice decides
 * what range of its own parameters a control covers, so every combination
 * sounds reasonable. 0 is each voice's own default
 */
export interface SoundSettings {
  tone: number     // -5 dark ... 5 bright
  attack: number   // -5 percussive ... 5 swelling
  length: number   // -5 short ... 5 ringing
  space: number    // 0 dry ... 10 roomy
  balance: number  // -5 bass forward ... 5 treble forward
  play: PlayStyle
}

export type SoundControl = Exclude<keyof SoundSettings, "play">

// each control's [min, max]
export const SOUND_RANGES: Readonly<Record<SoundControl, readonly [number, number]>> = Object.freeze({
  tone: [-5, 5],
  attack: [-5, 5],
  length: [-5, 5],
  space: [0, 10],
  balance: [-5, 5]
})

export const DEFAULT_SOUND: Readonly<SoundSettings> = Object.freeze({
  tone: 0,
  attack: 0,
  length: 0,
  space: 0,
  balance: 0,
  play: "a"
})

export interface Settings {
  // a SYNTH_TYPES key
  synth: string
  // 0-100
  volume: number
  // a FORMAT_OPTIONS key
  format: string
  // how guitar/ukulele chords are shown: "f" full cards, "t" a compact tab chart
  fretView: string
  eq: EQSettings
  sound: SoundSettings
}

// default eq settings in decibels. frozen since it's shared: copy it
// before changing a band
export const DEFAULT_EQ: Readonly<EQSettings> = Object.freeze({
  low: 0,
  mid: 0,
  high: 0
})

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  synth: "p",  // plumber
  volume: 80,
  format: "p", // piano
  fretView: "f", // full
  eq: DEFAULT_EQ,
  sound: DEFAULT_SOUND
})

export const FORMAT_OPTIONS: Record<string, string> = {
  "p": "piano",
  "g": "guitar",
  "u": "ukulele",
}

// whether the format shows fretted (guitar or ukulele) chords
export function isGuitar(format: string): boolean {
  return ["g", "u"].includes(format)
}

// whether every band of the eq is at zero
export function hasFlatEq(eqSettings: EQSettings): boolean {
  return eqSettings.low === 0 &&
         eqSettings.mid === 0 &&
         eqSettings.high === 0
}

// whether any band differs between the two
export function eqDiffers(eq: EQSettings, other: EQSettings): boolean {
  return eq.low !== other.low ||
         eq.mid !== other.mid ||
         eq.high !== other.high
}

// whether every sound control is at its default
export function hasDefaultSound(sound: SoundSettings): boolean {
  return !soundDiffers(sound, DEFAULT_SOUND)
}

// whether any sound control differs between the two
export function soundDiffers(sound: SoundSettings, other: SoundSettings): boolean {
  return sound.tone !== other.tone ||
         sound.attack !== other.attack ||
         sound.length !== other.length ||
         sound.space !== other.space ||
         sound.balance !== other.balance ||
         sound.play !== other.play
}

// the play style a chord is played with in the given format
export function resolvePlayStyle(play: PlayStyle, format: string): ResolvedPlayStyle {
  if (play === "a") return isGuitar(format) ? "s" : "c"
  return play
}
