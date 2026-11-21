/**
 * how this browser likes chords played. unlike the sound settings these
 * aren't shared in the url: they're the listener's habits, not part of
 * the progression. kept in localStorage, and every read and write
 * survives storage being blocked, since they're only conveniences
 */

// which way a strum sweeps: low to high, high to low, or each in turn
export type StrumDirection = "down" | "up" | "alternate"

export const STRUM_DIRECTIONS: Record<StrumDirection, string> = {
  down: "Down",
  up: "Up",
  alternate: "Alternate"
}

// the order an arpeggio's notes are played in. custom plays the
// listener's own pattern
export type ArpPattern = "up" | "down" | "updown" | "downup" | "converge" | "alberti" | "random" | "custom"

export const ARP_PATTERNS: Record<ArpPattern, string> = {
  up: "Up",
  down: "Down",
  updown: "Up & down",
  downup: "Down & up",
  converge: "Outside in",
  alberti: "Alberti",
  random: "Random",
  custom: "Custom"
}

/**
 * a pattern of the listener's own: a list of steps, each the rows (0 is
 * the bass, going up the chord) played on it, or none for a rest
 */
export type CustomPattern = number[][]

// the rows and steps a custom pattern can have
export const CUSTOM_ROWS = 6
export const CUSTOM_MIN_STEPS = 2
export const CUSTOM_MAX_STEPS = 16

// how quickly an arpeggio's notes follow each other
export type ArpSpeed = "slow" | "medium" | "fast"

export const ARP_SPEEDS: Record<ArpSpeed, string> = {
  slow: "Slow",
  medium: "Medium",
  fast: "Fast"
}

// whether an arpeggio's notes ring on together or each stops at the next
export type ArpSustain = "ring" | "separate"

export const ARP_SUSTAINS: Record<ArpSustain, string> = {
  ring: "Ring",
  separate: "Separate"
}

// how many octaves an arpeggio climbs: the chord, or the chord and the
// same notes an octave up
export type ArpOctaves = 1 | 2

export interface ArpeggioOptions {
  pattern: ArpPattern
  speed: ArpSpeed
  sustain: ArpSustain
  octaves: ArpOctaves
  // played when the pattern is custom
  custom: CustomPattern
  // repeat the pattern until it's stopped
  loop: boolean
}

export interface PlayPrefs {
  // loosen each note's timing and level a little
  humanize: boolean
  strum: StrumDirection
  arpeggio: ArpeggioOptions
  // play the first chord after a settings change
  previewChanges: boolean
}

/**
 * a custom pattern as text, for saving: each step's rows counted from 1,
 * or "-" for a rest, with the steps joined by dots. "1.3.2.-" plays the
 * bass, the third note up, the second, then rests
 */
export function formatCustomPattern(pattern: CustomPattern): string {
  return pattern.map((rows) => rows.length ? rows.map((row) => row + 1).join("") : "-").join(".")
}

// reads a custom pattern saved by formatCustomPattern. null if it isn't one
export function parseCustomPattern(text: string): CustomPattern | null {
  const steps = text.split(".")
  if (steps.length < CUSTOM_MIN_STEPS || steps.length > CUSTOM_MAX_STEPS) return null
  const pattern: CustomPattern = []
  for (const step of steps) {
    if (step === "-") {
      pattern.push([])
      continue
    }
    if (!/^[1-9]+$/.test(step)) return null
    const rows = [...new Set([...step].map((digit) => Number(digit) - 1))]
    if (rows.some((row) => row >= CUSTOM_ROWS)) return null
    pattern.push(rows.sort((a, b) => a - b))
  }
  return pattern
}

// an alberti-like figure that climbs to the octave, to start a custom pattern from
export const DEFAULT_CUSTOM_PATTERN: CustomPattern = [[0], [2], [1], [2], [0], [2], [1], [3]]

export const DEFAULT_ARPEGGIO: Readonly<ArpeggioOptions> = Object.freeze({
  pattern: "up",
  speed: "medium",
  sustain: "ring",
  octaves: 1,
  custom: DEFAULT_CUSTOM_PATTERN,
  loop: false
})

export const DEFAULT_PLAY_PREFS: Readonly<PlayPrefs> = Object.freeze({
  humanize: false,
  strum: "down",
  arpeggio: DEFAULT_ARPEGGIO,
  previewChanges: true
})

const KEYS = {
  humanize: "chord-buildr:humanize",
  strum: "chord-buildr:strum-direction",
  arpPattern: "chord-buildr:arp-pattern",
  arpSpeed: "chord-buildr:arp-speed",
  arpSustain: "chord-buildr:arp-sustain",
  arpOctaves: "chord-buildr:arp-octaves",
  arpCustom: "chord-buildr:arp-custom",
  arpLoop: "chord-buildr:arp-loop",
  // the key this flag was first saved under, so it carries over
  previewChanges: "chord-buildr:preview-changes"
} as const

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

// the saved value if it's one of the choices, otherwise the fallback
function readChoice<T extends string>(key: string, choices: Record<T, string>, fallback: T): T {
  const value = read(key)
  return value !== null && Object.prototype.hasOwnProperty.call(choices, value) ? value as T : fallback
}

function readArpeggio(): ArpeggioOptions {
  const custom = read(KEYS.arpCustom)
  return {
    pattern: readChoice(KEYS.arpPattern, ARP_PATTERNS, DEFAULT_ARPEGGIO.pattern),
    speed: readChoice(KEYS.arpSpeed, ARP_SPEEDS, DEFAULT_ARPEGGIO.speed),
    sustain: readChoice(KEYS.arpSustain, ARP_SUSTAINS, DEFAULT_ARPEGGIO.sustain),
    octaves: read(KEYS.arpOctaves) === "2" ? 2 : DEFAULT_ARPEGGIO.octaves,
    custom: (custom === null ? null : parseCustomPattern(custom)) ?? DEFAULT_ARPEGGIO.custom,
    loop: read(KEYS.arpLoop) === "on"
  }
}

// the saved preferences, with the default for any not saved
export function readPlayPrefs(): PlayPrefs {
  const humanize = read(KEYS.humanize)
  const previewChanges = read(KEYS.previewChanges)

  return {
    humanize: humanize === null ? DEFAULT_PLAY_PREFS.humanize : humanize === "on",
    strum: readChoice(KEYS.strum, STRUM_DIRECTIONS, DEFAULT_PLAY_PREFS.strum),
    arpeggio: readArpeggio(),
    previewChanges: previewChanges === null ? DEFAULT_PLAY_PREFS.previewChanges : previewChanges !== "off"
  }
}

/**
 * saves the given preferences, leaving the rest as they are. the arpeggio
 * options can be given in part too
 */
export function writePlayPrefs(prefs: Partial<Omit<PlayPrefs, "arpeggio">> & { arpeggio?: Partial<ArpeggioOptions> }): void {
  try {
    if (prefs.humanize !== undefined) localStorage.setItem(KEYS.humanize, prefs.humanize ? "on" : "off")
    if (prefs.strum !== undefined) localStorage.setItem(KEYS.strum, prefs.strum)
    if (prefs.previewChanges !== undefined) {
      localStorage.setItem(KEYS.previewChanges, prefs.previewChanges ? "on" : "off")
    }

    const arpeggio = prefs.arpeggio ?? {}
    if (arpeggio.pattern !== undefined) localStorage.setItem(KEYS.arpPattern, arpeggio.pattern)
    if (arpeggio.speed !== undefined) localStorage.setItem(KEYS.arpSpeed, arpeggio.speed)
    if (arpeggio.sustain !== undefined) localStorage.setItem(KEYS.arpSustain, arpeggio.sustain)
    if (arpeggio.octaves !== undefined) localStorage.setItem(KEYS.arpOctaves, String(arpeggio.octaves))
    if (arpeggio.custom !== undefined) localStorage.setItem(KEYS.arpCustom, formatCustomPattern(arpeggio.custom))
    if (arpeggio.loop !== undefined) localStorage.setItem(KEYS.arpLoop, arpeggio.loop ? "on" : "off")
  } catch {
    // not saved: they're only conveniences
  }
}
