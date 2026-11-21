/**
 * the playback and display settings a progression is shared with. nothing
 * here touches audio or the ui, so the url codec can use it without pulling
 * either in
 */

export interface EQSettings {
  low: number    // frequency range: 20-250 Hz
  mid: number    // frequency range: 250-2000 Hz
  high: number   // frequency range: 2000-20000 Hz
}

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
  eq: DEFAULT_EQ
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
