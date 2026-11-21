import { describe, expect, it } from "vitest"
import { chordMap } from "../utils/chordManager"
import { noteLetterMapWithFlats, noteLetterMapWithSharps } from "../utils/noteManager"
import { FORMAT_OPTIONS, Settings, isGuitar } from "../utils/settings"
import { SYNTH_TYPES } from "../utils/synthTypes"
import { CodableChord, parseProgressionCode, serializeProgressionCode } from "./progression"
import { parseSettingsCode, serializeSettingsCode } from "./settings"
import { parseShareCode, serializeShareCode } from "./share"

/**
 * shared links have to keep working, so whatever the app writes has to read
 * back the same. these generate progressions from a seeded random source,
 * so a failure names its seed and can be replayed
 */

const RUNS = 300

// mulberry32: small, fast, and good enough for picking test cases
function random(seed: number): () => number {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = <T,>(rand: () => number, items: readonly T[]): T => items[Math.floor(rand() * items.length)]

const SHARP_LETTERS = Object.values(noteLetterMapWithSharps)
const ALL_LETTERS = [...new Set([...SHARP_LETTERS, ...Object.values(noteLetterMapWithFlats)])]
const TYPES = Object.keys(chordMap)

interface GenOptions {
  letters: readonly string[]
  withKey: boolean
}

function generateProgression(rand: () => number, { letters, withKey }: GenOptions): CodableChord[] {
  const length = 1 + Math.floor(rand() * 8)
  const keyIndex = withKey ? Math.floor(rand() * length) : -1
  let breakId = 0

  return Array.from({ length }, (_, i) => {
    const slash = rand() < 0.3
    const root = pick(rand, letters)
    const slashNote = slash ? pick(rand, letters) : undefined
    // position 0 is the default voicing, which the code leaves out
    const position = rand() < 0.3 ? 1 + Math.floor(rand() * 5) : undefined

    return {
      isProgKey: i === keyIndex,
      showFlats: root.includes("b") || (slashNote?.includes("b") ?? false),
      breakAfter: rand() < 0.25 ? breakId++ : undefined,
      selectedChord: {
        noteLetter: root,
        type: pick(rand, TYPES),
        octave: Math.floor(rand() * 3),
        slash: slash || undefined,
        slashNote,
        position
      }
    }
  })
}

// what of a chord the code carries, with unset fields dropped
function comparable(chords: CodableChord[]) {
  return chords.map(({ selectedChord, isProgKey, showFlats, breakAfter }) => ({
    selectedChord: JSON.parse(JSON.stringify(selectedChord)),
    isProgKey: Boolean(isProgKey),
    showFlats: Boolean(showFlats),
    hasBreak: breakAfter !== undefined
  }))
}

describe("progression code round trip", () => {
  it("a progression with no key and sharp roots reads back exactly", () => {
    for (let seed = 1; seed <= RUNS; seed++) {
      const chords = generateProgression(random(seed), { letters: SHARP_LETTERS, withKey: false })
      const code = serializeProgressionCode(chords)

      expect(comparable(parseProgressionCode(code)), `seed ${seed}: ${code}`)
        .toEqual(comparable(chords))
    }
  })

  it("any progression's code reads back to the same code", () => {
    for (let seed = 1; seed <= RUNS; seed++) {
      const chords = generateProgression(random(seed), { letters: ALL_LETTERS, withKey: true })
      const code = serializeProgressionCode(chords)

      expect(serializeProgressionCode(parseProgressionCode(code)), `seed ${seed}`).toBe(code)
    }
  })

  it("chord ids are unique", () => {
    for (let seed = 1; seed <= RUNS; seed++) {
      const chords = generateProgression(random(seed), { letters: ALL_LETTERS, withKey: true })
      const ids = parseProgressionCode(serializeProgressionCode(chords)).map((c) => c.id)

      expect(new Set(ids).size, `seed ${seed}`).toBe(ids.length)
    }
  })
})

describe("settings code round trip", () => {
  const eqs = [{ low: 0, mid: 0, high: 0 }, { low: -10, mid: 3, high: 10 }, { low: 0, mid: -1, high: 0 }]

  it("every valid setting reads back exactly", () => {
    for (const synth of Object.keys(SYNTH_TYPES)) {
      for (const format of Object.keys(FORMAT_OPTIONS)) {
        for (const fretView of ["f", "t"]) {
          for (const volume of [0, 37, 80, 100]) {
            for (const eq of eqs) {
              const settings: Settings = { synth, volume, format, fretView, eq }
              const parsed = parseSettingsCode(serializeSettingsCode(settings))

              expect(parsed).toEqual({
                ...settings,
                // the tab view is only kept for fretted formats
                fretView: isGuitar(format) ? fretView : undefined
              })
            }
          }
        }
      }
    }
  })
})

describe("share code round trip", () => {
  it("settings and progression read back from the url query", () => {
    for (let seed = 1; seed <= RUNS; seed++) {
      const rand = random(seed)
      const chords = generateProgression(rand, { letters: ALL_LETTERS, withKey: rand() < 0.5 })
      const settings: Settings = {
        synth: pick(rand, Object.keys(SYNTH_TYPES)),
        volume: Math.floor(rand() * 101),
        format: "g",
        fretView: pick(rand, ["f", "t"]),
        eq: { low: 1, mid: 0, high: -2 }
      }
      const code = serializeShareCode(settings, chords)

      // as read from location.search + location.hash, # included
      const shared = parseShareCode(`?${code}`)

      expect(shared.settings, `seed ${seed}`).toEqual(settings)
      expect(serializeShareCode(settings, shared.chords), `seed ${seed}`).toBe(code)
    }
  })

  it("an empty progression", () => {
    const settings: Settings = { synth: "p", volume: 80, format: "p", fretView: "f", eq: { low: 0, mid: 0, high: 0 } }

    expect(serializeShareCode(settings, [])).toBe("s=p:80:p&")
    expect(parseShareCode("?s=p:80:p&").chords).toEqual([])
  })

  it("older links with prog= still read", () => {
    expect(parseShareCode("?prog=(1C)(1G)").chords.map((c) => c.selectedChord.noteLetter)).toEqual(["C", "G"])
  })
})

describe("share code: augmented chords", () => {
  it("a + in the url is the augmented type, not a space", () => {
    expect(parseShareCode("?s=p:80:p&p=(1C+)(1G)").chords.map((c) => c.selectedChord.type)).toEqual(["+", ""])
  })

  it("a percent-encoded + still reads", () => {
    expect(parseShareCode("?s=p:80:p&p=(1C%2B)(1G)").chords.map((c) => c.selectedChord.type)).toEqual(["+", ""])
  })
})
