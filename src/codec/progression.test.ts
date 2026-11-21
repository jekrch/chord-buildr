import { expect, it } from "vitest"
import { parseProgressionCode, serializeProgressionCode } from "./progression"

const getBreaks = (progCode: string) =>
  parseProgressionCode(progCode).map((chord) => chord.breakAfter !== undefined)

it("section breaks: read from the progression code onto the chord before them", () => {
  expect(getBreaks("(1C)(1G)(-)(1Am)(1F)")).toEqual([false, true, false, false])
})

it("section breaks: leading and repeated breaks collapse, a trailing one stays", () => {
  expect(getBreaks("(-)(1C)(-)(-)(1G)(-)")).toEqual([true, true])
})

it("section breaks: each one gets its own id", () => {
  const chords = parseProgressionCode("(1C)(-)(1G)(-)(1Am)")
  expect(chords[0].breakAfter).not.toBe(chords[1].breakAfter)
})

it("section breaks: written back into the progression code", () => {
  expect(serializeProgressionCode(parseProgressionCode("(1C)(1G)(-)(1Am)(-)"))).toBe("(1C)(1G)(-)(1Am)(-)")
})

it("progression code: invalid chords are skipped", () => {
  expect(parseProgressionCode("(1C)(1Hm)(1Cxyz)(1G)").map((c) => c.selectedChord.noteLetter)).toEqual(["C", "G"])
})

it("progression code: only the first chord marked as the key keeps it", () => {
  expect(parseProgressionCode("(1C*)(1G*)").map((c) => c.isProgKey)).toEqual([true, false])
})

it("progression code: a chord's id is its code's place in the progression code", () => {
  expect(parseProgressionCode("(1C)(-)(1G)").map((c) => c.id)).toEqual([0, 2])
})

it("progression code: octave, slash note, and position", () => {
  const [chord] = parseProgressionCode("(2Abm7:Gb.3)")

  expect(chord.selectedChord).toMatchObject({
    noteLetter: "Ab",
    type: "m7",
    octave: 2,
    slash: true,
    slashNote: "Gb",
    position: 2
  })
  expect(chord.showFlats).toBe(true)
})

it("progression code: roots are spelled for the key's scale", () => {
  // Eb major has Bb, not A#
  expect(serializeProgressionCode(parseProgressionCode("(1Eb*)(1A#)"))).toBe("(1Eb*)(1Bb)")
})

it("progression code: url noise around a chord is ignored", () => {
  expect(parseProgressionCode("(1C)(1G#piano-3)").map((c) => c.selectedChord.noteLetter)).toEqual(["C", "G"])
  expect(parseProgressionCode("(1C)(1G&amp;s=x)")).toHaveLength(1)
})
