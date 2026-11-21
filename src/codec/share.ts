import type { Settings } from "../utils/settings"
import { CodableChord, CodedChord, parseProgressionCode, serializeProgressionCode } from "./progression"
import { CodedSettings, parseSettingsCode, serializeSettingsCode } from "./settings"

/**
 * the whole shareable code, i.e. the url's query: s=<settings>&p=<progression>.
 * older links may use prog= for the progression
 */

export interface SharedProgression {
  settings: CodedSettings
  chords: CodedChord[]
}

/**
 * reads a shared code, with or without its leading ?. chord names can
 * contain #, so pass the url's search and hash together. throws if the code
 * is percent-encoded badly
 */
export function parseShareCode(code: string): SharedProgression {
  // handle percent-encoded strings
  const decodedCode = code.includes("%") ? decodeURIComponent(code) : code

  // URLSearchParams reads + as a space, but here it's the augmented chord
  // type (C+), which the code writes as is
  const query = decodedCode.replace(/\+/g, "%2B")

  // create a url-like string to use URLSearchParams
  const searchParams = new URLSearchParams(query.startsWith("?") ? query : `?${query}`)

  return {
    settings: parseSettingsCode(searchParams.get("s")),
    chords: parseProgressionCode(searchParams.get("prog") || searchParams.get("p"))
  }
}

/**
 * writes a shared code, without its leading ? and without escaping
 * characters
 */
export function serializeShareCode(settings: Settings, chords: CodableChord[]): string {
  const settingsCode = serializeSettingsCode(settings)
  const progCode = serializeProgressionCode(chords)

  return `s=${settingsCode}&${progCode.length ? `p=${progCode}` : ""}`
}
