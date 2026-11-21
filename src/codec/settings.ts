import {
  DEFAULT_EQ,
  DEFAULT_SETTINGS,
  DEFAULT_SOUND,
  EQSettings,
  FORMAT_OPTIONS,
  PLAY_STYLES,
  PlayStyle,
  SOUND_RANGES,
  Settings,
  SoundControl,
  SoundSettings,
  hasDefaultSound,
  hasFlatEq,
  isGuitar
} from "../utils/settings"
import { SYNTH_TYPES } from "../utils/synthTypes"

/**
 * the settings code in the url: "synth:volume:format:eq:sound", e.g.
 * "p:90:p:0.10.0". a fretted format may carry a "t" suffix for the tab
 * view (e.g. "gt"); without it the full view is used. the eq is only
 * written when it isn't flat, and the sound only when it isn't the
 * default: "tone.attack.length.space.balance.play", e.g. "-2.0.3.5.-1.r".
 * a sound with a flat eq leaves the eq empty ("p:80:p::-2.0.3.5.-1.r").
 * codes from before the sound was added have no fifth part, and older
 * versions of the app ignore it
 */

// the sound controls in the order the code writes them
const SOUND_CONTROLS: SoundControl[] = ["tone", "attack", "length", "space", "balance"]

// the tab view is only read from a fretted format's code
export type CodedSettings = Omit<Settings, "fretView"> & { fretView?: string }

function isValidSynth(synth: string | undefined): synth is string {
  return synth !== undefined && Object.keys(SYNTH_TYPES).includes(synth)
}

function isValidFormat(format: string | undefined): format is string {
  return format !== undefined && Object.keys(FORMAT_OPTIONS).includes(format)
}

function isValidVol(volume: number): boolean {
  return !isNaN(volume) && volume >= 0 && volume <= 100
}

/**
 * reads a settings code. anything missing or invalid falls back to its
 * default
 */
export function parseSettingsCode(settingsCode: string | null): CodedSettings {
  const defaults: CodedSettings = {
    synth: DEFAULT_SETTINGS.synth,
    volume: DEFAULT_SETTINGS.volume,
    format: DEFAULT_SETTINGS.format,
    eq: { ...DEFAULT_EQ },
    sound: { ...DEFAULT_SOUND }
  }

  if (!settingsCode) {
    return defaults
  }

  const [synth, volumeStr, formatCode, eq, sound] = settingsCode.split(":")
  const tabView = formatCode !== undefined && formatCode.length > 1 && formatCode.endsWith("t")
  const format = tabView ? formatCode.slice(0, -1) : formatCode
  const volume = parseInt(volumeStr ?? "")

  // a copy, so a code's eq never writes into the shared default
  const eqSettings: EQSettings = { ...DEFAULT_EQ }

  if (eq) {
    const [low, mid, high] = eq.split(".").map((value) => parseInt(value))

    // a band that doesn't parse (or is missing) stays flat
    const band = (value: number | undefined, flat: number) =>
      value !== undefined && Number.isFinite(value) ? value : flat
    eqSettings.low = band(low, DEFAULT_EQ.low)
    eqSettings.mid = band(mid, DEFAULT_EQ.mid)
    eqSettings.high = band(high, DEFAULT_EQ.high)
  }

  return {
    synth: isValidSynth(synth) ? synth : defaults.synth,
    volume: isValidVol(volume) ? volume : defaults.volume,
    format: isValidFormat(format) ? format : defaults.format,
    fretView: isValidFormat(format) && isGuitar(format) ? (tabView ? "t" : "f") : undefined,
    eq: eqSettings,
    sound: parseSoundCode(sound)
  }
}

/**
 * reads the sound part of a settings code. a control that doesn't parse
 * keeps its default, and one out of range is clamped into it
 */
function parseSoundCode(code: string | undefined): SoundSettings {
  const sound: SoundSettings = { ...DEFAULT_SOUND }
  if (!code) return sound

  const parts = code.split(".")

  SOUND_CONTROLS.forEach((control, index) => {
    const value = parseInt(parts[index] ?? "")
    if (!Number.isFinite(value)) return
    const [min, max] = SOUND_RANGES[control]
    sound[control] = Math.min(max, Math.max(min, value))
  })

  const play = parts[SOUND_CONTROLS.length]
  if (play && Object.keys(PLAY_STYLES).includes(play)) sound.play = play as PlayStyle

  return sound
}

// writes a settings code
export function serializeSettingsCode(settings: Settings): string {
  const tabSuffix = isGuitar(settings.format) && settings.fretView === "t" ? "t" : ""
  let settingsCode = `${settings.synth}:${settings.volume}:${settings.format}${tabSuffix}`

  const eqCode = hasFlatEq(settings.eq)
    ? ""
    : `${settings.eq.low}.${settings.eq.mid}.${settings.eq.high}`
  const sound = settings.sound ?? DEFAULT_SOUND
  const soundCode = hasDefaultSound(sound)
    ? ""
    : [...SOUND_CONTROLS.map((control) => sound[control]), sound.play].join(".")

  // trailing parts are only written when they, or a part after them, aren't the default
  if (soundCode) settingsCode += `:${eqCode}:${soundCode}`
  else if (eqCode) settingsCode += `:${eqCode}`

  return settingsCode
}
