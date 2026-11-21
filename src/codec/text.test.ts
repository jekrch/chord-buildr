import { expect, it } from "vitest"
import { parseProgressionCode } from "./progression"
import { convertProgressionStrToCode, getProgressionString } from "./text"

it("section breaks: a lone / or | in the text editor", () => {
  expect(convertProgressionStrToCode("C G / Am | F")).toBe("(1C)(1G)(-)(1Am)(-)(1F)")
  // a slash chord is still a slash chord
  expect(convertProgressionStrToCode("C/E G")).toBe("(1C:E)(1G)")
})

it("section breaks: shown as / in the text editor", () => {
  expect(getProgressionString(parseProgressionCode("(1C)(1G)(-)(1Am)")).trim()).toBe("C G / Am")
})

it("text editor: every comma separates chords", () => {
  expect(convertProgressionStrToCode("C,G,Am,F")).toBe("(1C)(1G)(1Am)(1F)")
  expect(convertProgressionStrToCode("C, G, Am")).toBe("(1C)(1G)(1Am)")
})

it("text editor: octaves, accidentals, and positions", () => {
  const code = convertProgressionStrToCode("2Ebmaj7 0f#m 5G.3")
  expect(code).toBe("(2Ebmaj7)(0f#m)(2G.3)")

  // a lowercase root is capitalized when the code is read
  expect(parseProgressionCode(code).map((c) => c.selectedChord)).toMatchObject([
    { noteLetter: "Eb", type: "maj7", octave: 2 },
    { noteLetter: "F#", type: "m", octave: 0 },
    { noteLetter: "G", type: "", octave: 2, position: 2 }
  ])
})

it("text editor: spelled-out and unknown types fall back to the nearest one", () => {
  expect(convertProgressionStrToCode("Cminor Dmajor Ediminished")).toBe("(1Cm)(1D)(1Edim)")
  expect(convertProgressionStrToCode("Cm7add13 Gfoo")).toBe("(1Cm7)(1Gx)")
})
