import { describe, expect, it } from "vitest"
import { chordMap } from "./chordManager"
import { ChordPiano } from "./chordPianoHandler"
import {
  ChordPosition,
  findChordPositions,
  findChordVoicings,
  getChordChart,
  isSlashNoteMissing,
  getNonChordIntervals,
  Instrument,
  normalizeKey,
  normalizeSuffix,
  UNSUPPORTED_GUITAR_CHORDS
} from "./guitarUtil"
import { getLoadedInstrument, loadInstrument } from "./instruments"

const guitarInstrument = await loadInstrument("g")
const ukuleleInstrument = await loadInstrument("u")

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

// frets counted from the nut, low string first, x for muted strings
const toTab = (position: ChordPosition): string =>
  position.frets
    .map(fret => (fret < 0 ? "x" : fret === 0 ? 0 : fret + position.baseFret - 1))
    .join(" ")

/**
 * Returns what's wrong with a shape findChordPositions made (rather than
 * took from chords-db): midi notes that don't match its frets, or fingers
 * and barres a hand can't hold
 */
const getShapeProblems = (
  name: string,
  position: ChordPosition,
  instrument: Instrument,
  openStrings: number[]
): string[] => {
  const problems: string[] = []
  const fingerFrets = new Map<number, Set<number>>()

  if (positionMidi(position, openStrings).join() !== position.midi.join()) {
    problems.push(`${name}: midi ${position.midi} doesn't match the frets`)
  }
  position.frets.forEach((fret, string) => {
    const finger = position.fingers[string]
    if (fret > instrument.fretsOnChord) problems.push(`${name}: fret ${fret} is off the diagram`)
    if (fret > 0 && !finger) problems.push(`${name}: string ${string + 1} has no finger`)
    if (fret <= 0 && finger) problems.push(`${name}: string ${string + 1} isn't fretted but has a finger`)
    if (fret > 0) fingerFrets.set(finger, (fingerFrets.get(finger) ?? new Set()).add(fret))
  })
  fingerFrets.forEach((frets, finger) => {
    if (frets.size > 1) problems.push(`${name}: finger ${finger} is on more than one fret`)
  })
  position.barres.forEach(barre => {
    if (position.frets.filter(fret => fret === barre).length < 2) {
      problems.push(`${name}: barre at ${barre} holds fewer than two notes`)
    }
  })
  return problems
}

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

  // findChordPositions makes some shapes by moving a note of a chords-db
  // shape. The snapshot lists them as tab, frets counted from the nut, to
  // review for playability when it changes.
  it("move notes into shapes a hand can play", () => {
    const dbPositions = new Set<ChordPosition>(
      Object.values(instrument.chords as Record<string, ChordEntry[]>)
        .flatMap(group => group.flatMap(chord => chord.positions))
    )
    const problems: string[] = []
    const shapes: string[] = []

    for (const type of Object.keys(chordMap)) {
      for (const noteLetter of ROOTS) {
        findChordPositions({ noteLetter, type }, instrument.chords, format).forEach((position, i) => {
          if (dbPositions.has(position)) return

          const name = `${noteLetter}${type} #${i + 1}`
          problems.push(...getShapeProblems(name, position, instrument, openStrings))

          const fingers = position.fingers.map(finger => finger || "-").join(" ")
          shapes.push(`${name}: ${toTab(position)}  (fingers ${fingers})`)
        })
      }
    }

    expect(problems).toEqual([])
    expect(shapes).toMatchSnapshot()
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
    expect([...unsupportedTypes].sort()).toEqual([...UNSUPPORTED_GUITAR_CHORDS[format]].sort())

    // supported types that have no diagram for some roots
    const gaps = missing
      .filter(m => !unsupportedTypes.has(m.type))
      .map(m => `${m.noteLetter}${m.type}`)
    expect(gaps).toMatchSnapshot()
  })

  // slash chords use chords-db voicings that already have the bass note
  // lowest, or make them by moving a string to the bass note and muting the
  // strings below it. When nothing fits, the chord shows without the bass.
  it("put the slash note in the bass", () => {
    const dbPositions = new Set<ChordPosition>(
      Object.values(instrument.chords as Record<string, ChordEntry[]>)
        .flatMap(group => group.flatMap(chord => chord.positions))
    )
    const problems: string[] = []

    for (const type of Object.keys(chordMap)) {
      ROOTS.forEach((noteLetter, root) => {
        const plain = findChordPositions({ noteLetter, type }, instrument.chords, format)
        const chordIntervals = new Set(chordMap[type].map(interval => interval % 12))

        for (let bassInterval = 1; bassInterval < 12; bassInterval++) {
          const slashNote = ROOTS[(root + bassInterval) % 12]
          const name = `${noteLetter}${type}/${slashNote}`
          const positions = findChordPositions(
            { noteLetter, type, slash: true, slashNote }, instrument.chords, format
          )
          // no voicing has the bass note, so the chord shows without it
          if (positions.map(toTab).join() === plain.map(toTab).join()) continue

          positions.forEach((position, i) => {
            const midi = position.midi
            const lowest = Math.min(...midi)
            if ((lowest - root + 120) % 12 !== bassInterval) {
              problems.push(`${name} #${i + 1}: ${toTab(position)} has the wrong bass note`)
            }
            const extra = midi.filter(note => note !== lowest && !chordIntervals.has((note - root + 120) % 12)
              && (note - root + 120) % 12 !== bassInterval)
            if (extra.length) problems.push(`${name} #${i + 1}: ${toTab(position)} sounds notes outside the chord`)
            if (!dbPositions.has(position)) {
              problems.push(...getShapeProblems(`${name} #${i + 1}`, position, instrument, openStrings))
            }
          })
        }
      })
    }

    expect(problems).toEqual([])
  })
})

describe("slash chord diagrams", () => {
  const tabs = (format: string, instrument: Instrument, noteLetter: string, type: string, slashNote: string) =>
    findChordPositions({ noteLetter, type, slash: true, slashNote }, instrument.chords, format).map(toTab)

  it.each([
    ["G", "", "B", "x 2 0 0 0 3"],
    ["D", "", "F#", "2 x 0 2 3 2"],
    ["C", "", "G", "3 3 2 0 1 0"],
    ["C", "", "B", "x 2 2 0 1 0"],
    ["C", "", "E", "0 3 2 0 1 0"],
    ["A", "m", "G", "3 0 2 2 1 0"],
    ["F", "", "C", "x 3 3 2 1 1"],
    ["D", "m", "C", "x 3 0 2 3 1"],
    ["A", "", "C#", "x 4 2 2 2 0"],
    ["E", "m", "D#", "x x 1 0 0 0"],
  ])("include the usual guitar shape for %s%s/%s", (noteLetter, type, slashNote, tab) => {
    expect(tabs("g", guitarInstrument, noteLetter, type, slashNote)).toContain(tab)
  })

  it("include ukulele shapes with the bass note lowest", () => {
    expect(tabs("u", ukuleleInstrument, "A", "m", "G")).toContain("5 7 5 7")
    expect(tabs("u", ukuleleInstrument, "F", "", "C")).toContain("2 0 1 0")
  })

  it("show the chord without its bass note when nothing fits", () => {
    // B can't be the lowest note near the nut on a re-entrant ukulele
    const plain = findChordPositions({ noteLetter: "G", type: "" }, ukuleleInstrument.chords, "u")
    expect(tabs("u", ukuleleInstrument, "G", "", "B")).toEqual(plain.map(toTab))
  })

  it("say when the bass note is left out", () => {
    const voicings = (format: string, instrument: Instrument, noteLetter: string, type: string, slashNote?: string) =>
      findChordVoicings({ noteLetter, type, slash: Boolean(slashNote), slashNote }, instrument.chords, format)

    expect(voicings("u", ukuleleInstrument, "G", "", "B").bassMissing).toBe(true)
    expect(voicings("g", guitarInstrument, "G", "", "B").bassMissing).toBe(false)
    expect(voicings("g", guitarInstrument, "G", "").bassMissing).toBe(false)
    expect(voicings("g", guitarInstrument, "C", "", "C").bassMissing).toBe(false)

    expect(isSlashNoteMissing({ noteLetter: "G", type: "" }, "B", "u", ukuleleInstrument)).toBe(true)
    expect(isSlashNoteMissing({ noteLetter: "G", type: "" }, "B", "g", guitarInstrument)).toBe(false)
    // a chord with no voicing at all has nothing to leave the bass out of
    expect(isSlashNoteMissing({ noteLetter: "C", type: "x" }, "E", "g", guitarInstrument)).toBe(false)
  })

  it("name the chart without a bass note it leaves out", () => {
    const chart = (noteLetter: string, slashNote: string, format: string) =>
      getChordChart(
        { selectedChord: { noteLetter, type: "", slash: true, slashNote } } as ChordPiano,
        format,
        format === "g" ? guitarInstrument : ukuleleInstrument
      )

    const ukulele = chart("G", "B", "u")
    expect(ukulele.bassMissing).toBe(true)
    expect(ukulele.chartChord).toMatchObject({ noteLetter: "G", slash: false, slashNote: null })

    const guitar = chart("G", "B", "g")
    expect(guitar.bassMissing).toBe(false)
    expect(guitar.chartChord).toMatchObject({ noteLetter: "G", slash: true, slashNote: "B" })
  })

  it("ignore a slash note that is the root or switched off", () => {
    const plain = findChordPositions({ noteLetter: "C", type: "" }, guitarInstrument.chords, "g")
    expect(tabs("g", guitarInstrument, "C", "", "C")).toEqual(plain.map(toTab))
    expect(
      findChordPositions({ noteLetter: "C", type: "", slash: false, slashNote: "E" }, guitarInstrument.chords, "g")
    ).toEqual(plain)
  })
})

describe("instrument loading", () => {
  it("loads each instrument's chord shapes once", async () => {
    expect(getLoadedInstrument("g")).toBe(guitarInstrument)
    expect(await loadInstrument("g")).toBe(guitarInstrument)
    expect(guitarInstrument).toMatchObject({ name: "Guitar", strings: 6 })
    expect(ukuleleInstrument).toMatchObject({ name: "Ukulele", strings: 4 })
    expect(guitarInstrument.chords.C.length).toBeGreaterThan(0)
  })

  it("has no shapes for piano", async () => {
    expect(getLoadedInstrument("p")).toBeUndefined()
    await expect(loadInstrument("p")).rejects.toThrow()
  })
})
