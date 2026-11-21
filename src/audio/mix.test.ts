import { describe, expect, it, vi } from "vitest"
import {
  ARPEGGIO_STEPS,
  ARPEGGIO_STEP_SECONDS,
  HUMANIZE_DB,
  HUMANIZE_SECONDS,
  NOTE_BASE_DB,
  STRUM_SECONDS,
  arpeggioNotes,
  arpeggioOrder,
  arpeggioSteps,
  fitArpeggioNotes,
  loopCycle,
  loopSteps,
  eqCompensationDb,
  humanize,
  macro,
  noteLevelsDb,
  noteSides,
  noteTimings,
  noteVelocity,
  playSpanSeconds,
  spaceMix,
  toMidi,
  volumeToDb
} from "./mix"
import { DEFAULT_ARPEGGIO, type ArpPattern } from "../utils/playPrefs"

const powerOf = (levels: number[]) => levels.reduce((sum, db) => sum + 10 ** (db / 10), 0)

// a major triad in close position on each octave the piano card spans
const triads = [48, 60, 72].map((root) => [root, root + 4, root + 7])

describe("noteLevelsDb", () => {
  it("turns a lone note down as it rises above middle c", () => {
    const levels = [60, 64, 67, 72, 79, 84].map((midi) => noteLevelsDb([midi])[0]!)
    for (let index = 1; index < levels.length; index++) {
      expect(levels[index]).toBeLessThan(levels[index - 1]!)
    }
  })

  it("keeps the bass note of a chord louder than its top note in every octave", () => {
    for (const triad of triads) {
      const [bass, , top] = noteLevelsDb(triad)
      // the top note's own lift takes about 1 dB off what the tilt and
      // the bass's lift give it
      expect(bass! - top!).toBeGreaterThan(2.5)
    }
  })

  it("lifts the top note of a close chord over its inner voice", () => {
    // at the default balance; further toward the bass the tilt outweighs it
    for (const triad of triads) {
      const [, inner, top] = noteLevelsDb(triad)
      expect(top).toBeGreaterThan(inner!)
    }
  })

  it("only lifts the top note when there are inner voices under it", () => {
    // two notes: the tilt and the bass's lift alone
    const [bass, top] = noteLevelsDb([60, 72])
    expect(bass! - top!).toBeCloseTo(3 + 2)
  })

  it("never lifts the top note past the bass at any balance", () => {
    for (let balance = -5; balance <= 5; balance++) {
      for (const triad of triads) {
        const [bass, , top] = noteLevelsDb(triad, balance)
        expect(bass).toBeGreaterThan(top!)
      }
    }
  })

  it("still favors the bass a little at the treble end of the balance", () => {
    for (const triad of triads) {
      const [bass, , top] = noteLevelsDb(triad, 5)
      expect(bass).toBeGreaterThan(top!)
    }
  })

  it("leans further toward the bass as the balance goes down", () => {
    const gap = (balance: number) => {
      const [bass, , top] = noteLevelsDb([48, 52, 55], balance)
      return bass! - top!
    }
    expect(gap(-5)).toBeGreaterThan(gap(0))
    expect(gap(0)).toBeGreaterThan(gap(5))
  })

  it("keeps a chord's total level near a lone note's, however many notes it has", () => {
    const lone = powerOf(noteLevelsDb([60]))
    // c major as a guitar voices it, from two notes up to all six strings
    const strings = [40, 47, 52, 56, 59, 64]

    for (let count = 2; count <= strings.length; count++) {
      const ratioDb = 10 * Math.log10(powerOf(noteLevelsDb(strings.slice(0, count))) / lone)
      expect(ratioDb).toBeGreaterThan(-3)
      expect(ratioDb).toBeLessThan(4)
    }
  })

  it("plays a chord up high no louder than the same chord down low", () => {
    const [low, , high] = triads.map((triad) => powerOf(noteLevelsDb(triad)))
    expect(high).toBeLessThan(low!)
  })

  it("keeps even a low six-string strum's summed peak under full scale", () => {
    // every note's peak lined up at once: the worst a chord could reach
    const worstPeak = noteLevelsDb([40, 45, 50, 55, 59, 64])
      .reduce((sum, db) => sum + noteVelocity(db), 0)
    expect(worstPeak).toBeLessThan(1.25)
  })

  it("softens the tilt for a voice with a smaller tilt scale", () => {
    const gap = (scale: number) => {
      const [bass, , top] = noteLevelsDb([48, 60, 72], 0, scale)
      return bass! - top!
    }
    expect(gap(0.5)).toBeLessThan(gap(1))
  })

  it("has nothing to say about no notes", () => {
    expect(noteLevelsDb([])).toEqual([])
  })
})

describe("noteSides", () => {
  it("keeps the bass and everything below middle c in the center", () => {
    expect(noteSides([40, 47, 52, 55, 59])).toEqual([0, 0, 0, 0, 0])
    expect(noteSides([60, 64, 67])[0]).toBe(0)
  })

  it("spreads the notes above middle c to alternate sides from the top down", () => {
    // c e g c: the top c right, the g left, the e right
    expect(noteSides([48, 64, 67, 72])).toEqual([0, 1, -1, 1])
  })

  it("places notes by pitch, whatever order they're played in", () => {
    expect(noteSides([72, 67, 64, 48])).toEqual([1, -1, 1, 0])
  })

  it("has nothing to say about no notes", () => {
    expect(noteSides([])).toEqual([])
  })
})

describe("humanize", () => {
  const timings = noteTimings(3, "c", 1)
  const levels = [0, -2, -4]

  it("changes nothing when the dice land in the middle", () => {
    expect(humanize(timings, levels, () => 0.5)).toEqual({ timings, levels })
  })

  it("moves each start and level by at most its limit, either way", () => {
    const early = humanize(timings, levels, () => 0)
    const late = humanize(timings, levels, () => 1)

    early.timings.forEach((timing) => expect(timing.offset).toBeCloseTo(-HUMANIZE_SECONDS))
    late.timings.forEach((timing) => expect(timing.offset).toBeCloseTo(HUMANIZE_SECONDS))
    early.levels.forEach((level, index) => expect(level).toBeCloseTo(levels[index]! - HUMANIZE_DB))
    late.levels.forEach((level, index) => expect(level).toBeCloseTo(levels[index]! + HUMANIZE_DB))
  })

  it("leaves how long each note is held alone", () => {
    const { timings: loosened } = humanize(timings, levels, Math.random)
    expect(loosened.map((timing) => timing.duration)).toEqual(timings.map((timing) => timing.duration))
  })
})

describe("noteVelocity", () => {
  it("is the base level at 0 dB, and never more than 1", () => {
    expect(noteVelocity(0)).toBeCloseTo(10 ** (NOTE_BASE_DB / 20))
    expect(noteVelocity(40)).toBe(1)
  })
})

describe("volumeToDb", () => {
  it("is 0 dB at the default volume and rises with the volume", () => {
    expect(volumeToDb(80)).toBe(0)
    expect(volumeToDb(100)).toBeGreaterThan(0)
    expect(volumeToDb(100)).toBeLessThan(5)
    expect(volumeToDb(40)).toBeLessThan(volumeToDb(60))
    expect(volumeToDb(0)).toBe(-Infinity)
  })
})

describe("eqCompensationDb", () => {
  it("is 0 for a flat eq or cuts, and turns down further for bigger boosts", () => {
    expect(eqCompensationDb({ low: 0, mid: 0, high: 0 })).toBe(0)
    expect(eqCompensationDb({ low: -6, mid: -3, high: -10 })).toBe(0)

    for (const band of ["low", "mid", "high"] as const) {
      const at = (boost: number) => eqCompensationDb({ low: 0, mid: 0, high: 0, [band]: boost })
      expect(at(4)).toBeLessThan(at(2))
      expect(at(10)).toBeLessThan(at(4))
    }
  })
})

describe("macro", () => {
  const range = [0.01, 0.1, 1] as const

  it("gives the default at 0 and the ends at either end", () => {
    expect(macro(0, range)).toBeCloseTo(0.1)
    expect(macro(-5, range)).toBeCloseTo(0.01)
    expect(macro(5, range)).toBeCloseTo(1)
  })

  it("moves on a log scale, and clamps past the ends", () => {
    expect(macro(2.5, range)).toBeCloseTo(Math.sqrt(0.1))
    expect(macro(9, range)).toBeCloseTo(1)
  })

  it("moves in a straight line when the range touches 0", () => {
    expect(macro(2.5, [0, 0, 1])).toBeCloseTo(0.5)
  })
})

describe("spaceMix", () => {
  it("is dry at 0, and adds reverb as the room grows", () => {
    expect(spaceMix(0)).toEqual({ dry: 1, wet: 0 })
    expect(spaceMix(5).wet).toBeGreaterThan(0)
    expect(spaceMix(10).wet).toBeGreaterThan(spaceMix(5).wet)
    expect(spaceMix(10).dry).toBeLessThan(1)
  })
})

describe("noteTimings", () => {
  it("starts a chord's notes together", () => {
    expect(noteTimings(3, "c", 1)).toEqual([
      { index: 0, offset: 0, duration: 1 },
      { index: 1, offset: 0, duration: 1 },
      { index: 2, offset: 0, duration: 1 }
    ])
  })

  it("spreads a strum over the same time whatever the number of strings", () => {
    for (const count of [3, 6]) {
      const timings = noteTimings(count, "s", 1)
      expect(timings[count - 1]!.offset).toBeCloseTo(STRUM_SECONDS * (count - 1) / count)
    }
  })

  it("holds an arpeggio's notes until its last note ends", () => {
    const timings = noteTimings(4, "r", 1)
    const ends = timings.map(({ offset, duration }) => offset + duration)
    expect(timings.map((timing) => timing.offset)).toEqual([0, 1, 2, 3].map((step) => step * ARPEGGIO_STEP_SECONDS))
    for (const end of ends) expect(end).toBeCloseTo(ends[0]!)
  })

  it("playSpanSeconds is when the last note starts", () => {
    expect(playSpanSeconds(4, "c")).toBe(0)
    expect(playSpanSeconds(4, "r")).toBeCloseTo(3 * ARPEGGIO_STEP_SECONDS)
    expect(playSpanSeconds(4, "r", { ...DEFAULT_ARPEGGIO, pattern: "updown", speed: "fast" }))
      .toBeCloseTo(6 * ARPEGGIO_STEPS.fast)
  })

  it("spaces an arpeggio's notes by its speed", () => {
    for (const speed of ["slow", "medium", "fast"] as const) {
      const timings = noteTimings(3, "r", 1, { ...DEFAULT_ARPEGGIO, speed })
      expect(timings[1]!.offset).toBeCloseTo(ARPEGGIO_STEPS[speed])
    }
    expect(ARPEGGIO_STEPS.slow).toBeGreaterThan(ARPEGGIO_STEPS.medium)
    expect(ARPEGGIO_STEPS.medium).toBeGreaterThan(ARPEGGIO_STEPS.fast)
  })

  it("plays the notes of an arpeggio in its pattern's order", () => {
    const order = (pattern: ArpPattern) =>
      noteTimings(4, "r", 1, { ...DEFAULT_ARPEGGIO, pattern }).map((timing) => timing.index)
    expect(order("up")).toEqual([0, 1, 2, 3])
    expect(order("down")).toEqual([3, 2, 1, 0])
    expect(order("updown")).toEqual([0, 1, 2, 3, 2, 1, 0])
    expect(order("downup")).toEqual([3, 2, 1, 0, 1, 2, 3])
    expect(order("converge")).toEqual([0, 3, 1, 2])
  })

  it("lets a repeated arpeggio note ring until it comes round again", () => {
    const step = ARPEGGIO_STEPS.medium
    const timings = noteTimings(3, "r", 1, { ...DEFAULT_ARPEGGIO, pattern: "updown" })
    // 0 1 2 1 0: the first 1 stops as the second starts, and the rest
    // end together
    expect(timings[1]!.offset + timings[1]!.duration).toBeCloseTo(3 * step)
    const end = 4 * step + 1
    for (const position of [2, 3, 4]) {
      expect(timings[position]!.offset + timings[position]!.duration).toBeCloseTo(end)
    }
    expect(timings[0]!.offset + timings[0]!.duration).toBeCloseTo(4 * step)
  })

  it("holds every separate arpeggio note for a step, the last one too", () => {
    const step = ARPEGGIO_STEPS.medium
    const timings = noteTimings(3, "r", 1, { ...DEFAULT_ARPEGGIO, sustain: "separate" })
    expect(timings.map((timing) => timing.duration)).toEqual([step, step, step])
  })
})

describe("arpeggioOrder", () => {
  it("keeps the bass first and plays every note once when random", () => {
    const random = vi.fn().mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(0)
    const order = arpeggioOrder(5, "random", random)
    expect(order[0]).toBe(0)
    expect([...order].sort()).toEqual([0, 1, 2, 3, 4])
    expect(order).not.toEqual([0, 1, 2, 3, 4])
  })

  it("handles chords too small to turn around", () => {
    for (const pattern of ["up", "down", "updown", "downup", "converge", "alberti", "random", "custom"] as const) {
      expect(arpeggioOrder(0, pattern)).toEqual([])
      expect(arpeggioOrder(1, pattern)).toEqual([0])
    }
    expect(arpeggioOrder(3, "converge")).toEqual([0, 2, 1])
  })

  it("goes back to the top note between the others for alberti", () => {
    expect(arpeggioOrder(3, "alberti")).toEqual([0, 2, 1, 2])
    expect(arpeggioOrder(4, "alberti")).toEqual([0, 3, 1, 3, 2, 3])
  })
})

describe("arpeggioSteps", () => {
  const custom = (pattern: number[][]) => ({ pattern: "custom" as const, custom: pattern })

  it("plays a built-in pattern a note a step", () => {
    expect(arpeggioSteps(3, { pattern: "down", custom: [] })).toEqual([[2], [1], [0]])
  })

  it("plays a custom pattern's rows, rests and notes struck together", () => {
    expect(arpeggioSteps(4, custom([[0], [], [1, 3], [2]]))).toEqual([[0], [], [1, 3], [2]])
  })

  it("drops a custom pattern's rests before its first note and after its last", () => {
    expect(arpeggioSteps(3, custom([[], [0], [], [2], [], []]))).toEqual([[0], [], [2]])
  })

  it("plays up when a custom pattern has no notes", () => {
    expect(arpeggioSteps(3, custom([[], []]))).toEqual([[0], [1], [2]])
  })
})

describe("fitArpeggioNotes", () => {
  const custom = (pattern: number[][]) => ({ pattern: "custom" as const, custom: pattern })

  it("carries a chord on up an octave for rows past its top note", () => {
    expect(fitArpeggioNotes(["C4", "E4", "G4"], custom([[0], [3], [4]]))).toEqual(["C4", "E4", "G4", "C5", "E5"])
  })

  it("drops the notes above the highest row a custom pattern uses", () => {
    expect(fitArpeggioNotes(["E2", "B2", "E3", "G#3", "B3", "E4"], custom([[0], [2], [1]]))).toEqual(["E2", "B2", "E3"])
  })

  it("leaves the notes alone for the built-in patterns", () => {
    expect(fitArpeggioNotes(["C4", "E4"], { pattern: "up", custom: [[5]] })).toEqual(["C4", "E4"])
  })
})

describe("custom arpeggio timings", () => {
  const step = ARPEGGIO_STEPS.medium
  const options = (custom: number[][], sustain: "ring" | "separate" = "ring") =>
    ({ ...DEFAULT_ARPEGGIO, pattern: "custom" as const, custom, sustain })

  it("starts notes struck together at once, and keeps a rest's time", () => {
    const timings = noteTimings(3, "r", 1, options([[0, 2], [], [1]]))
    expect(timings.map(({ index, offset }) => [index, offset])).toEqual([[0, 0], [2, 0], [1, 2 * step]])
  })

  it("lets a separate note last a step, so a rest is heard", () => {
    const timings = noteTimings(2, "r", 1, options([[0], [], [1]], "separate"))
    expect(timings.map((timing) => timing.duration)).toEqual([step, step])
  })
})

describe("arpeggioNotes", () => {
  it("runs low to high and drops doubled notes", () => {
    expect(arpeggioNotes(["G4", "C4", "E4", "C4"], 1)).toEqual(["C4", "E4", "G4"])
  })

  it("adds the chord an octave up over two octaves, without doubling notes", () => {
    expect(arpeggioNotes(["C4", "E4", "G4"], 2)).toEqual(["C4", "E4", "G4", "C5", "E5", "G5"])
    expect(arpeggioNotes(["E2", "B2", "E3"], 2)).toEqual(["E2", "B2", "E3", "B3", "E4"])
  })
})

describe("toMidi", () => {
  it("reads sharps and octaves", () => {
    expect(toMidi("C4")).toBe(60)
    expect(toMidi("C#3")).toBe(49)
    expect(toMidi("E2")).toBe(40)
  })
})

describe("looping arpeggios", () => {
  const custom = (pattern: number[][]) => ({ pattern: "custom" as const, custom: pattern })
  const step = ARPEGGIO_STEPS.medium

  it("leave off the note a turning pattern would play twice in a row", () => {
    expect(loopSteps(3, { pattern: "updown", custom: [] })).toEqual([[0], [1], [2], [1]])
    expect(loopSteps(3, { pattern: "downup", custom: [] })).toEqual([[2], [1], [0], [1]])
    expect(loopSteps(3, { pattern: "up", custom: [] })).toEqual([[0], [1], [2]])
  })

  it("keep a custom pattern's rests, starting on its first note", () => {
    expect(loopSteps(3, custom([[], [0], [], [2], []]))).toEqual([[0], [], [2], [], []])
  })

  it("ring each note until it comes round again, into the next cycle", () => {
    const { timings, length } = loopCycle(3, 1, { ...DEFAULT_ARPEGGIO, pattern: "updown" })
    expect(length).toBeCloseTo(4 * step)
    // 0 1 2 1: the bass and top once a cycle, the middle twice
    expect(timings.map((timing) => timing.duration / step)).toEqual([4, 2, 4, 2].map((gaps) => expect.closeTo(gaps)))
  })

  it("hold each separate note for a step", () => {
    const { timings } = loopCycle(3, 1, { ...DEFAULT_ARPEGGIO, sustain: "separate" })
    expect(timings.map((timing) => timing.duration)).toEqual([step, step, step])
  })
})
