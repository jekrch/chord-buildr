import { beforeEach, describe, expect, it } from "vitest"
import { parseProgressionCode, serializeShareCode } from "../codec"
import { getChordKeys } from "../utils/chordPianoHandler"
import { DEFAULT_SETTINGS } from "../utils/settings"
import { useAppStore } from "./progressionStore"

const actions = () => useAppStore.getState().actions
const chords = () => useAppStore.getState().chords
const letters = () => chords().map((chord) => chord.selectedChord.noteLetter)

function load(progCode: string) {
  useAppStore.setState({ chords: parseProgressionCode(progCode), past: [] })
}

beforeEach(() => {
  useAppStore.setState({ chords: [], settings: DEFAULT_SETTINGS, past: [], generation: 0 })
})

describe("progression store: editing", () => {
  it("adds chords as C in the middle octave, with ids that don't repeat", () => {
    actions().addChord()
    actions().addChord()
    actions().removeChord(0)
    actions().addChord()

    expect(chords().map((chord) => chord.id)).toEqual([1, 2])
    expect(chords()[0].selectedChord).toEqual({ noteLetter: "C", type: "", octave: 1 })
  })

  it("leaves chords it doesn't edit as they were", () => {
    load("(1C)(1G)")
    const [c, g] = chords()

    actions().setChordType(g.id, "m")

    expect(chords()[0]).toBe(c)
    expect(chords()[1]).not.toBe(g)
    expect(chords()[1].selectedChord.type).toBe("m")
  })

  it("spells a new root for the key", () => {
    load("(1F*)(1C)")

    actions().setChordRoot(1, "A#")

    expect(letters()).toEqual(["F", "Bb"])
    expect(chords()[1].selectedChord.octave).toBe(1)
  })

  it("moving the key chord transposes the rest of the progression", () => {
    load("(1C*)(1F)(1G:B)")

    actions().setChordRoot(0, "D", 1)

    expect(letters()).toEqual(["D", "G", "A"])
    expect(chords()[2].selectedChord.slashNote).toBe("C#")
    expect(chords().map((chord) => chord.selectedChord.octave)).toEqual([1, 1, 1])
  })

  it("a transposed chord that wraps down an octave from the bottom octave moves back up", () => {
    load("(0B*)(1D)")

    actions().setChordRoot(0, "C", 1)

    expect(chords()[1].selectedChord).toMatchObject({ noteLetter: "D#", octave: 1 })
  })

  it("marking a key respells the other chords for its scale", () => {
    load("(1F)(1A#)(1C:A#)")

    actions().setProgKey(0, true)

    expect(chords().map((chord) => chord.isProgKey)).toEqual([true, false, false])
    expect(letters()).toEqual(["F", "Bb", "C"])
    expect(chords()[2].selectedChord.slashNote).toBe("Bb")
  })

  it("only one chord is the key", () => {
    load("(1F*)(1C)")

    actions().setProgKey(1, true)
    expect(chords().map((chord) => chord.isProgKey)).toEqual([false, true])

    actions().setProgKey(1, false)
    expect(chords().map((chord) => chord.isProgKey)).toEqual([false, false])
  })

  it("switching the key chord to flats respells it and the chords in its key", () => {
    load("(1A#*)(1D#)(1E)")

    actions().setShowFlats(0, true)

    expect(chords()[0].showFlats).toBe(true)
    expect(letters()).toEqual(["Bb", "Eb", "E"])
  })

  it("switching a chord to flats respells its root", () => {
    load("(1C#)")

    actions().setShowFlats(0, true)
    expect(letters()).toEqual(["Db"])

    actions().setShowFlats(0, false)
    expect(letters()).toEqual(["C#"])
  })

  it("turning off a slash chord clears its bass note", () => {
    load("(1C:E)")

    actions().setSlashChord(0, false)

    expect(chords()[0].selectedChord).toMatchObject({ slash: false, slashNote: "" })
  })

  it("stored chords are frozen, so they can't be changed in place", () => {
    load("(1C)")
    actions().addChord()

    expect(() => { chords()[0].selectedChord.noteLetter = "D" }).toThrow()
  })
})

describe("progression store: undo", () => {
  it("steps back through progression changes", () => {
    actions().addChord()
    actions().setChordType(0, "m7")
    actions().addSectionBreak()

    actions().undo()
    expect(chords()[0].breakAfter).toBeUndefined()

    actions().undo()
    expect(chords()[0].selectedChord.type).toBe("")

    actions().undo()
    expect(chords()).toEqual([])
    expect(useAppStore.getState().past).toEqual([])
  })

  it("an edit that changes nothing isn't a step", () => {
    load("(1C)")

    actions().setChordRoot(0, "C", 1)
    actions().setChordType(0, "")

    expect(useAppStore.getState().past).toEqual([])
  })

  it("settings changes aren't steps, and undo leaves them alone", () => {
    load("(1C)")
    actions().addChord()
    actions().setFormat("g")
    actions().setVolume(40)

    actions().undo()

    expect(chords()).toHaveLength(1)
    expect(useAppStore.getState().settings).toMatchObject({ format: "g", volume: 40 })
  })

  it("clearing can be undone", () => {
    load("(1C)(1G)")

    actions().clear()
    expect(chords()).toEqual([])

    actions().undo()
    expect(letters()).toEqual(["C", "G"])
  })

  it("transposing the whole progression is a single step", () => {
    load("(1C*)(1F)(1G)")

    actions().setChordRoot(0, "D", 1)
    actions().undo()

    expect(letters()).toEqual(["C", "F", "G"])
  })
})

describe("progression store: loading", () => {
  it("a shared code sets the settings and the chords, without an undo step", () => {
    expect(actions().loadShareCode("?s=h:60:gt:2.0.-3&p=(1C)(1G:B)")).toBe(true)

    const state = useAppStore.getState()
    expect(state.settings).toEqual({ synth: "h", volume: 60, format: "g", fretView: "t", eq: { low: 2, mid: 0, high: -3 } })
    expect(letters()).toEqual(["C", "G"])
    expect(state.past).toEqual([])
  })

  it("a piano code keeps the guitar view as it was; a fretted one sets it", () => {
    actions().setFretView("t")

    actions().loadShareCode("?s=p:80:p&p=(1C)")
    expect(useAppStore.getState().settings.fretView).toBe("t")

    actions().loadShareCode("?s=p:80:g&p=(1C)")
    expect(useAppStore.getState().settings.fretView).toBe("f")
  })

  it("a badly encoded code leaves everything as it was", () => {
    load("(1C)")

    expect(actions().loadShareCode("?p=(1C)%E0%A4%A")).toBe(false)
    expect(letters()).toEqual(["C"])
  })

  it("the progression editor's code replaces the chords, can be undone, and remounts the board", () => {
    load("(1C)")

    actions().loadProgression("(1Am)(-)(1F)")

    expect(letters()).toEqual(["A", "F"])
    expect(chords()[0].breakAfter).toBe(0)
    expect(useAppStore.getState().generation).toBe(1)

    actions().undo()
    expect(letters()).toEqual(["C"])
  })

  it("the share code is written from the settings and the chords", () => {
    load("(1C)(1G)(-)(1Am)(-)")
    const { settings } = useAppStore.getState()

    expect(serializeShareCode(settings, chords())).toBe("s=p:80:p&p=(1C)(1G)(-)(1Am)(-)")
  })
})

describe("getChordKeys", () => {
  it("is the chord's keys on the 36-key piano, lowest first", () => {
    expect(getChordKeys({ noteLetter: "C", type: "", octave: 0 })).toEqual([0, 4, 7])
    expect(getChordKeys({ noteLetter: "A", type: "m", octave: 1 })).toEqual([21, 24, 28])
  })

  it("puts a slash chord's bass note at the bottom", () => {
    const keys = getChordKeys({ noteLetter: "C", type: "", octave: 1, slash: true, slashNote: "E" })

    expect(keys[0] % 12).toBe(4)
    expect(keys.map((key) => key % 12).sort()).toEqual([0, 4, 7])
  })

  it("keeps every key on the piano", () => {
    const keys = getChordKeys({ noteLetter: "B", type: "13", octave: 2 })

    expect(keys.every((key) => key >= 0 && key < 36)).toBe(true)
  })
})
