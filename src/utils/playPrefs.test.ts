import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  DEFAULT_PLAY_PREFS,
  formatCustomPattern,
  parseCustomPattern,
  readPlayPrefs,
  writePlayPrefs
} from "./playPrefs"

describe("play preferences", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("are the defaults when nothing is saved", () => {
    expect(readPlayPrefs()).toEqual(DEFAULT_PLAY_PREFS)
  })

  it("read back what was saved, leaving the rest alone", () => {
    writePlayPrefs({ humanize: true, strum: "alternate" })
    expect(readPlayPrefs()).toEqual({ ...DEFAULT_PLAY_PREFS, humanize: true, strum: "alternate" })

    writePlayPrefs({ previewChanges: false })
    expect(readPlayPrefs()).toEqual({ ...DEFAULT_PLAY_PREFS, humanize: true, strum: "alternate", previewChanges: false })
  })

  it("save the arpeggio options one at a time", () => {
    writePlayPrefs({ arpeggio: { pattern: "converge", octaves: 2 } })
    writePlayPrefs({ arpeggio: { speed: "fast" } })
    expect(readPlayPrefs().arpeggio).toEqual({
      ...DEFAULT_PLAY_PREFS.arpeggio,
      pattern: "converge",
      speed: "fast",
      octaves: 2
    })

    writePlayPrefs({ arpeggio: { sustain: "separate" } })
    expect(readPlayPrefs().arpeggio.sustain).toBe("separate")
  })

  it("save a custom arpeggio pattern", () => {
    const custom = [[0], [], [1, 3], [5]]
    writePlayPrefs({ arpeggio: { pattern: "custom", custom } })
    expect(readPlayPrefs().arpeggio).toMatchObject({ pattern: "custom", custom })
  })

  it("write custom patterns as text and read them back", () => {
    expect(formatCustomPattern([[0], [], [1, 3]])).toBe("1.-.24")
    expect(parseCustomPattern("1.-.42.4")).toEqual([[0], [], [1, 3], [3]])
    for (const bad of ["", "1", "1.7", "1.x", "1..2", Array(17).fill("1").join(".")]) {
      expect(parseCustomPattern(bad)).toBeNull()
    }
  })

  it("fall back to the defaults for arpeggio options they don't know", () => {
    localStorage.setItem("chord-buildr:arp-pattern", "sideways")
    localStorage.setItem("chord-buildr:arp-speed", "toString")
    localStorage.setItem("chord-buildr:arp-octaves", "7")
    localStorage.setItem("chord-buildr:arp-custom", "1.9")
    expect(readPlayPrefs().arpeggio).toEqual(DEFAULT_PLAY_PREFS.arpeggio)
  })

  it("keep the play-on-change flag saved before they existed", () => {
    localStorage.setItem("chord-buildr:preview-changes", "off")
    expect(readPlayPrefs().previewChanges).toBe(false)
  })

  it("fall back to the default for a strum direction they don't know", () => {
    localStorage.setItem("chord-buildr:strum-direction", "sideways")
    expect(readPlayPrefs().strum).toBe(DEFAULT_PLAY_PREFS.strum)
  })

  it("are the defaults, and saving does nothing, when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })

    expect(readPlayPrefs()).toEqual(DEFAULT_PLAY_PREFS)
    expect(() => writePlayPrefs({ humanize: true })).not.toThrow()
  })
})
