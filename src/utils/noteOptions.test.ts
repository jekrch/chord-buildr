import { describe, expect, it } from "vitest"
import { getNoteOptions, getRootOptions, getSlashOptions, spellForKey } from "./noteOptions"
import { SelectedChord } from "./chordPianoHandler"

const SHARPS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
const FLATS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]

const fMajor: SelectedChord = { noteLetter: "F", type: "major", octave: 1 }
const dMinor: SelectedChord = { noteLetter: "D", type: "m", octave: 1 }

describe("spellForKey", () => {
  it("keeps the note's spelling without a key", () => {
    expect(spellForKey(undefined, "A#")).toBe("A#")
  })

  it("spells a note in the key's scale the key's way", () => {
    expect(spellForKey(fMajor, "A#")).toBe("Bb")
    expect(spellForKey(dMinor, "A#")).toBe("Bb")
  })

  it("leaves a note outside the key's scale alone", () => {
    expect(spellForKey(fMajor, "F#")).toBe("F#")
  })

  it("takes an empty note as C", () => {
    expect(spellForKey(undefined, "")).toBe("C")
    expect(spellForKey(fMajor, "  ")).toBe("C")
  })
})

describe("getNoteOptions", () => {
  it("lists the twelve notes with sharps or flats", () => {
    expect(getNoteOptions(undefined, false, "C", "")).toEqual(SHARPS)
    expect(getNoteOptions(undefined, true, "C", "")).toEqual(FLATS)
  })

  it("keeps sharps for a root spelled with a leading sharp", () => {
    expect(getNoteOptions(undefined, true, "#C", "")).toEqual(SHARPS)
  })

  it("puts the chord's own spellings in place of their pitches", () => {
    const options = getNoteOptions(undefined, false, "B#", "Fb")
    expect(options[0]).toBe("B#")
    expect(options[4]).toBe("Fb")
    expect(options).toHaveLength(12)
  })

  it("spells the notes for the key", () => {
    const options = getNoteOptions(fMajor, false, "F", "")
    expect(options).toContain("Bb")
    expect(options).not.toContain("A#")
    // C# isn't in F major, so it keeps its sharp
    expect(options).toContain("C#")
  })

  it("spells the notes for the key when both of the chord's notes are in it", () => {
    expect(getNoteOptions(fMajor, false, "G", "Bb")).toEqual(
      SHARPS.map((note) => (note === "A#" ? "Bb" : note))
    )
  })
})

describe("menu options", () => {
  it("spells the root menu for the key", () => {
    const options = getRootOptions(fMajor, SHARPS)
    expect(options[10]).toBe("Bb")
    expect(options).toHaveLength(12)
  })

  it("lets the chord's bass note stand in for its pitch", () => {
    const options = getSlashOptions(undefined, SHARPS, "Bb")
    expect(options[10]).toBe("Bb")
    expect(options.filter((note) => note === "A#")).toHaveLength(0)
  })

  it("spells the bass note menu for the key and skips blanks", () => {
    const options = getSlashOptions(fMajor, [...SHARPS, " "], "")
    expect(options).toHaveLength(12)
    expect(options[10]).toBe("Bb")
  })
})
