import { expect, it } from "vitest"
import { DEFAULT_EQ, DEFAULT_SOUND } from "../utils/settings"
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
    eq: { low: 0, mid: 0, high: 0 },
    sound: DEFAULT_SOUND
  })
})

it("settings code: the tab view is only read from a fretted format", () => {
  expect(parseSettingsCode("p:80:gt").fretView).toBe("t")
  expect(parseSettingsCode("p:80:g").fretView).toBe("f")
  expect(parseSettingsCode("p:80:pt").format).toBe("p")
  expect(parseSettingsCode("p:80:pt").fretView).toBeUndefined()
})

it("settings code: the eq is only written when it isn't flat", () => {
  const settings = { synth: "el", volume: 70, format: "u", fretView: "t", eq: { ...DEFAULT_EQ }, sound: { ...DEFAULT_SOUND } }

  expect(serializeSettingsCode(settings)).toBe("el:70:ut")
  expect(serializeSettingsCode({ ...settings, eq: { low: 0, mid: 4, high: 0 } })).toBe("el:70:ut:0.4.0")
})

it("settings code: the sound is only written when it isn't the default", () => {
  const settings = { synth: "p", volume: 80, format: "p", fretView: "f", eq: { ...DEFAULT_EQ }, sound: { ...DEFAULT_SOUND } }
  const sound = { tone: -2, attack: 0, length: 3, space: 5, balance: -1, play: "r" as const }

  expect(serializeSettingsCode(settings)).toBe("p:80:p")
  // a flat eq is left empty ahead of the sound
  expect(serializeSettingsCode({ ...settings, sound })).toBe("p:80:p::-2.0.3.5.-1.r")
  expect(serializeSettingsCode({ ...settings, eq: { low: 1, mid: 0, high: 0 }, sound })).toBe("p:80:p:1.0.0:-2.0.3.5.-1.r")
})

it("settings code: codes from before the sound read with the default sound", () => {
  expect(parseSettingsCode("p:80:p").sound).toEqual(DEFAULT_SOUND)
  expect(parseSettingsCode("p:80:p:0.4.0").sound).toEqual(DEFAULT_SOUND)
  expect(parseSettingsCode("p:80:p::-2.0.3.5.-1.r").eq).toEqual(DEFAULT_EQ)
})

it("settings code: a sound control out of range is clamped, and one that doesn't parse is the default", () => {
  expect(parseSettingsCode("p:80:p::9.-9.x.40.3.q").sound).toEqual({
    tone: 5,
    attack: -5,
    length: 0,
    space: 10,
    balance: 3,
    play: "a"
  })
  // a sound cut short keeps the defaults for what's missing
  expect(parseSettingsCode("p:80:p::2").sound).toEqual({ ...DEFAULT_SOUND, tone: 2 })
})
