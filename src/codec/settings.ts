import {
  DEFAULT_EQ,
  DEFAULT_SETTINGS,
  EQSettings,
  FORMAT_OPTIONS,
  Settings,
  hasFlatEq,
  isGuitar
} from "../utils/settings"
import { SYNTH_TYPES } from "../utils/synthTypes"

/**
 * the settings code in the url: "synth:volume:format:eq", e.g.
 * "p:90:p:0.10.0". a fretted format may carry a "t" suffix for the tab
 * view (e.g. "gt"); without it the full view is used. the eq is only
 * written when it isn't flat
 */

// the tab view is only read from a fretted format's code
export type CodedSettings = Omit<Settings, "fretView"> & { fretView?: string }

function isValidSynth(synth: string): boolean {
  return Object.keys(SYNTH_TYPES).includes(synth)
}

function isValidFormat(format: string): boolean {
  return Object.keys(FORMAT_OPTIONS).includes(format)
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
    eq: { ...DEFAULT_EQ }
  }

  if (!settingsCode) {
    return defaults
  }

  const [synth, volumeStr, formatCode, eq] = settingsCode.split(":")
  const tabView = formatCode?.length > 1 && formatCode.endsWith("t")
  const format = tabView ? formatCode.slice(0, -1) : formatCode
  const volume = parseInt(volumeStr)

  // a copy, so a code's eq never writes into the shared default
  const eqSettings: EQSettings = { ...DEFAULT_EQ }

  if (eq) {
    const [low, mid, high] = eq.split(".").map((value) => parseInt(value))

    // a band that doesn't parse stays flat
    eqSettings.low = Number.isFinite(low) ? low : DEFAULT_EQ.low
    eqSettings.mid = Number.isFinite(mid) ? mid : DEFAULT_EQ.mid
    eqSettings.high = Number.isFinite(high) ? high : DEFAULT_EQ.high
  }

  return {
    synth: isValidSynth(synth) ? synth : defaults.synth,
    volume: isValidVol(volume) ? volume : defaults.volume,
    format: isValidFormat(format) ? format : defaults.format,
    fretView: isGuitar(format) ? (tabView ? "t" : "f") : undefined,
    eq: eqSettings
  }
}

// writes a settings code
export function serializeSettingsCode(settings: Settings): string {
  const tabSuffix = isGuitar(settings.format) && settings.fretView === "t" ? "t" : ""
  let settingsCode = `${settings.synth}:${settings.volume}:${settings.format}${tabSuffix}`

  // if the eq is not the default, add it to the settings code
  if (!hasFlatEq(settings.eq)) {
    settingsCode += `:${settings.eq.low}.${settings.eq.mid}.${settings.eq.high}`
  }
  return settingsCode
}
