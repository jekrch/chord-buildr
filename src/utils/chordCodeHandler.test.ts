import { expect, it } from "vitest"
import { buildProgFromCode, getChordPianoSetFromProgCode, getStateParamsCode } from "./chordCodeHandler"
import { AppState } from "../components/context/AppContext"
import { DEFAULT_EQ } from "./settings"

const baseState = (): AppState => ({
  previousProgCodes: [],
  currentProgCode: null,
  building: false,
  synth: "p",
  volume: 80,
  format: "p",
  fretView: "f",
  eq: { ...DEFAULT_EQ }
})

it("state code: written from the state's settings and chords", () => {
  const state = { ...baseState(), chordPianoSet: getChordPianoSetFromProgCode("(1C)(1G)(-)(1Am)(-)") }

  expect(getStateParamsCode(state)).toBe("s=p:80:p&p=(1C)(1G)(-)(1Am)(-)")
})

it("state code: chord pianos built from a code get their keys' piano", () => {
  const [chordPiano] = getChordPianoSetFromProgCode("(2Eb7*)")

  expect(chordPiano.selectedKey).toEqual({ noteLetter: "Eb", octave: 2 })
  expect(chordPiano.isProgKey).toBe(true)
  expect(chordPiano.showFlats).toBe(true)
  expect(chordPiano.piano).toHaveLength(3)
})

it("state code: building from a url sets the settings and chords", () => {
  const state = buildProgFromCode(baseState(), "?s=h:60:gt:2.0.-3&p=(1C)(1G:B)")

  expect(state.synth).toBe("h")
  expect(state.volume).toBe(60)
  expect(state.format).toBe("g")
  expect(state.fretView).toBe("t")
  expect(state.eq).toEqual({ low: 2, mid: 0, high: -3 })
  expect(state.chordPianoSet?.map((c) => c.selectedChord.noteLetter)).toEqual(["C", "G"])
  expect(state.currentProgCode).toBe("s=h:60:gt:2.0.-3&p=(1C)(1G:B)")
})

it("state code: a badly encoded url leaves the state as it was", () => {
  const state = buildProgFromCode(baseState(), "?p=(1C)%E0%A4%A")

  expect(state.chordPianoSet).toBeUndefined()
  expect(state.building).toBe(false)
})
