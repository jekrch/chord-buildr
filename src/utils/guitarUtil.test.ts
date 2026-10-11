import { describe, expect, it } from "vitest"
import { chordMap } from "./chordManager"
import {
  ChordPosition,
  findChordPositions,
  getNonChordIntervals,
  guitarInstrument,
  Instrument,
  normalizeKey,
  normalizeSuffix,
  ukuleleInstrument,
  UNSUPPORTED_GUITAR_CHORDS
} from "./guitarUtil"

interface ChordEntry {
  key: string;
  suffix: string;
  positions: ChordPosition[];
}

// midi numbers of the open strings, low string first, for each standard tuning
const instruments: { format: string, instrument: Instrument, openStrings: number[] }[] = [
  { format: "g", instrument: guitarInstrument, openStrings: [40, 45, 50, 55, 59, 64] },
  // re-entrant tuning: the G string is above middle C
  { format: "u", instrument: ukuleleInstrument, openStrings: [67, 60, 64, 69] },
]

const INTERVAL_NAMES = ["1", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"]

const ROOTS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]

const positionMidi = (position: ChordPosition, openStrings: number[]): number[] =>
  position.frets.flatMap((fret, string) => {
    if (fret < 0) return []
    const absoluteFret = fret === 0 ? 0 : fret + position.baseFret - 1
    return [openStrings[string] + absoluteFret]
  })

/**
 * Every chord type and root the app can request, paired with the chord the
 * diagram lookup resolves it to (same normalization as findChordPositions)
 */
const lookups = (format: string, instrument: Instrument) =>
  Object.keys(chordMap).flatMap(type =>
    Array.from({ length: 12 }, (_, i) => {
      const rootNoteNumber = i + 1
      const key = normalizeKey(rootNoteNumber, format)
      const chord: ChordEntry | undefined = instrument.chords[key]
        ?.find((c: ChordEntry) => c.suffix === normalizeSuffix(type))
      return { type, rootNoteNumber, key, chord }
    })
  )

describe.each(instruments)("$instrument.name chord diagrams", ({ format, instrument, openStrings }) => {

  it("store midi notes that match the frets", () => {
    const mismatches: string[] = []

    for (const { type, key, chord } of lookups(format, instrument)) {
      chord?.positions.forEach((position, i) => {
        const expected = positionMidi(position, openStrings)
        if (expected.join() !== position.midi.join()) {
          mismatches.push(`${key}${type} #${i + 1}: midi ${position.midi} should be ${expected}`)
        }
      })
    }

    expect(mismatches).toEqual([])
  })

  // findChordPositions hides voicings that sound notes outside the chord.
  // The snapshot records which chords-db voicings that currently hides; when
  // it changes, check the difference is intended before updating with -u.
  it("only sound notes that belong to the chord", () => {
    const wrongNotes: string[] = []

    for (const { type, rootNoteNumber, key, chord } of lookups(format, instrument)) {
      chord?.positions.forEach((position, i) => {
        const extra = getNonChordIntervals(position, rootNoteNumber, type)
        if (extra.length) {
          wrongNotes.push(`${key}${type} #${i + 1}: ${extra.map(n => INTERVAL_NAMES[n]).join(" ")}`)
        }
      })
    }

    expect(wrongNotes).toMatchSnapshot()
  })

  it("exist for every chord type not in UNSUPPORTED_GUITAR_CHORDS", () => {
    const missing = Object.keys(chordMap).flatMap(type =>
      ROOTS
        .filter(noteLetter => !findChordPositions({ noteLetter, type }, instrument.chords, format).length)
        .map(noteLetter => ({ noteLetter, type }))
    )
    const isMissingEverywhere = (type: string) =>
      missing.filter(m => m.type === type).length === ROOTS.length

    const unsupportedTypes = new Set(missing.map(m => m.type).filter(isMissingEverywhere))
    expect([...unsupportedTypes].sort()).toEqual([...UNSUPPORTED_GUITAR_CHORDS].sort())

    // supported types that have no diagram for some roots
    const gaps = missing
      .filter(m => !unsupportedTypes.has(m.type))
      .map(m => `${m.noteLetter}${m.type}`)
    expect(gaps).toMatchSnapshot()
  })
})
