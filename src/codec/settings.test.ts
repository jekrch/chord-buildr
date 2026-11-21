import { expect, it } from "vitest"
import { DEFAULT_EQ } from "../utils/settings"
import { parseSettingsCode, serializeSettingsCode } from "./settings"

it("settings code: a code's eq doesn't change the default eq", () => {
  const withEq = parseSettingsCode("p:80:p:3.-2.5")
  expect(withEq.eq).toEqual({ low: 3, mid: -2, high: 5 })

  expect(DEFAULT_EQ).toEqual({ low: 0, mid: 0, high: 0 })
  expect(parseSettingsCode("p:80:p").eq).toEqual({ low: 0, mid: 0, high: 0 })
  expect(parseSettingsCode(null).eq).not.toBe(withEq.eq)
})

it("settings code: an eq band that doesn't parse stays flat", () => {
  expect(parseSettingsCode("p:80:p:4.x").eq).toEqual({ low: 4, mid: 0, high: 0 })
})

it("settings code: invalid parts fall back to their defaults", () => {
  expect(parseSettingsCode("zz:250:q")).toEqual({
    synth: "p",
    volume: 80,
    format: "p",
    fretView: undefined,
    eq: { low: 0, mid: 0, high: 0 }
  })
})

it("settings code: the tab view is only read from a fretted format", () => {
  expect(parseSettingsCode("p:80:gt").fretView).toBe("t")
  expect(parseSettingsCode("p:80:g").fretView).toBe("f")
  expect(parseSettingsCode("p:80:pt").format).toBe("p")
  expect(parseSettingsCode("p:80:pt").fretView).toBeUndefined()
})

it("settings code: the eq is only written when it isn't flat", () => {
  const settings = { synth: "el", volume: 70, format: "u", fretView: "t", eq: { ...DEFAULT_EQ } }

  expect(serializeSettingsCode(settings)).toBe("el:70:ut")
  expect(serializeSettingsCode({ ...settings, eq: { low: 0, mid: 4, high: 0 } })).toBe("el:70:ut:0.4.0")
})
