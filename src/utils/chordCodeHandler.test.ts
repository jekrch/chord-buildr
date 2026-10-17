import { expect, it } from "vitest"
import {
  convertProgressionStrToCode,
  getChordPianoSetFromProgCode,
  getProgressionString,
  getStateParamsCode
} from "./chordCodeHandler"
import { AppState } from "../components/context/AppContext"
import { DEFAULT_EQ } from "./synthPlayer"

const getBreaks = (progCode: string) =>
  getChordPianoSetFromProgCode(progCode).map((chordPiano) => chordPiano.breakAfter !== undefined)

it("section breaks: read from the progression code onto the chord before them", () => {
  expect(getBreaks("(1C)(1G)(-)(1Am)(1F)")).toEqual([false, true, false, false])
})

it("section breaks: leading and repeated breaks collapse, a trailing one stays", () => {
  expect(getBreaks("(-)(1C)(-)(-)(1G)(-)")).toEqual([true, true])
})

it("section breaks: each one gets its own id", () => {
  const set = getChordPianoSetFromProgCode("(1C)(-)(1G)(-)(1Am)")
  expect(set[0].breakAfter).not.toBe(set[1].breakAfter)
})

it("section breaks: written back into the url code", () => {
  const state = {
    synth: "p",
    volume: 80,
    format: "p",
    fretView: "f",
    eq: DEFAULT_EQ,
    previousProgCodes: [],
    chordPianoSet: getChordPianoSetFromProgCode("(1C)(1G)(-)(1Am)(-)")
  } as unknown as AppState

  expect(getStateParamsCode(state)).toBe("s=p:80:p&p=(1C)(1G)(-)(1Am)(-)")
})

it("section breaks: a lone / or | in the text editor", () => {
  expect(convertProgressionStrToCode("C G / Am | F")).toBe("(1C)(1G)(-)(1Am)(-)(1F)")
  // a slash chord is still a slash chord
  expect(convertProgressionStrToCode("C/E G")).toBe("(1C:E)(1G)")
})

it("section breaks: shown as / in the text editor", () => {
  const set = getChordPianoSetFromProgCode("(1C)(1G)(-)(1Am)")
  expect(getProgressionString(set).trim()).toBe("C G / Am")
})
