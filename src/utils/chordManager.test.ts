import { expect, it } from "vitest"
import { getNoteNumberChord, getNoteLettersChordByKey } from "./chordManager"

it("getNoteNumberChord: return chord from root note and type", () => {
  expect(getNoteNumberChord(1, "")).toEqual([1, 5, 8])
  expect(getNoteNumberChord(2, "")).toEqual([2, 6, 9])
  expect(getNoteNumberChord(2, "m")).toEqual([2, 5, 9])
  expect(getNoteNumberChord(3, "m")).toEqual([3, 6, 10])
  expect(getNoteNumberChord(28, "m")).toEqual([28, 31, 35])
  expect(getNoteNumberChord(11, "add9")).toEqual([11, 15, 18, 25])
})

it("getNoteLettersChord: return chord letters from key, root note, and type", () => {
  expect(getNoteLettersChordByKey("c", 1, "")).toEqual(["C", "E", "G"])
  expect(getNoteLettersChordByKey("C", 2, "m")).toEqual(["C#", "E", "G#"])
  expect(getNoteLettersChordByKey("F", 2, "m")).toEqual(["Db", "E", "Ab"])
  expect(getNoteLettersChordByKey("F#", 7, "maj7")).toEqual(["F#", "A#", "C#", "F"])
  expect(getNoteLettersChordByKey("Ab", 7, "maj7")).toEqual(["Gb", "Bb", "Db", "F"])
  expect(getNoteLettersChordByKey("Ab", 3, "+")).toEqual(["D", "Gb", "Bb"])
  expect(getNoteLettersChordByKey("E", 3, "+")).toEqual(["D", "F#", "A#"])
})
