import { expect, it } from "vitest"
import { arrayMove } from "@dnd-kit/sortable"
import { getChordPianoSetFromProgCode, getProgressionString } from "./chordCodeHandler"
import {
  arrangeProgression,
  getProgressionItems,
  getSections,
  isStrayBreak,
  removeChord,
  toggleBreakAfter
} from "./sectionBreaks"
import { createSectionGridStrategy } from "./sectionGridStrategy"

const text = (code: string) => getProgressionString(getChordPianoSetFromProgCode(code)).trim()
const progression = (code: string) => getChordPianoSetFromProgCode(code)

it("dragging a chord past a break moves it into the next section", () => {
  const set = progression("(1C)(1G)(-)(1Am)(1F)")
  const items = getProgressionItems(set)
  // G (1) to F's slot (4)
  expect(getProgressionString(arrangeProgression(set, arrayMove(items, 1, 4))).trim()).toBe("C / Am F G")
})

it("dragging a break moves where the section ends, keeping its id", () => {
  const set = progression("(1C)(1G)(-)(1Am)(1F)")
  const items = getProgressionItems(set)
  const arranged = arrangeProgression(set, arrayMove(items, 2, 3))
  expect(getProgressionString(arranged).trim()).toBe("C G Am / F")
  expect(arranged[2].breakAfter).toBe(set[1].breakAfter)
})

it("a section emptied by a drag closes up", () => {
  const set = progression("(1C)(-)(1G)(-)(1Am)")
  const items = getProgressionItems(set)
  // G to the end
  expect(getProgressionString(arrangeProgression(set, arrayMove(items, 2, 4))).trim()).toBe("C / Am G")
})

it("a break at the start or next to another one is stray", () => {
  const items = getProgressionItems(progression("(1C)(-)(1G)(-)(1Am)"))
  expect(isStrayBreak(arrayMove(items, 1, 0), 0)).toBe(true)
  expect(isStrayBreak(arrayMove(items, 1, 2), 2)).toBe(true)
  expect(isStrayBreak(arrayMove(items, 3, 4), 4)).toBe(false)
})

it("removing a chord keeps the sections around it apart", () => {
  expect(text("(1C)(1G)(-)(1Am)")).toBe("C G / Am")
  const set = progression("(1C)(1G)(-)(1Am)")
  expect(getProgressionString(removeChord(set, set[1].id)).trim()).toBe("C / Am")
  expect(getProgressionString(removeChord(set, set[2].id)).trim()).toBe("C G /")

  const lone = progression("(1C)(-)(1G)(-)(1Am)")
  expect(getProgressionString(removeChord(lone, lone[1].id)).trim()).toBe("C / Am")
})

it("toggling a break after a chord", () => {
  const set = progression("(1C)(1G)(-)(1Am)")
  expect(getProgressionString(toggleBreakAfter(set, set[0].id)).trim()).toBe("C / G / Am")
  expect(getProgressionString(toggleBreakAfter(set, set[1].id)).trim()).toBe("C G Am")
})

it("grid strategy: a break closes its row and takes one of its own", () => {
  // two columns: [C][G] / break / [Am]
  const card = (left: number, top: number) => ({ left, top, width: 100, height: 50, right: left + 100, bottom: top + 50 })
  const rects = [
    card(0, 0),
    card(110, 0),
    { left: 0, top: 60, width: 210, height: 20, right: 210, bottom: 80 },
    card(0, 90)
  ]
  const strategy = createSectionGridStrategy(() => ({
    columns: 2,
    columnGap: 10,
    rowGap: 10,
    fullRow: [false, false, true, false]
  }))

  // the break dragged to Am's slot: [C][G] / [Am] / break
  const amMoves = strategy({ rects, activeIndex: 2, overIndex: 3, index: 3, activeNodeRect: null })
  expect(amMoves).toMatchObject({ x: 0, y: -30 })

  // G dragged after Am: [C] / break / [Am][G]. C's row still ends where it
  // did, so the break and Am stay put while G fills the slot beside Am
  const breakMoves = strategy({ rects, activeIndex: 1, overIndex: 3, index: 2, activeNodeRect: null })
  expect(breakMoves).toMatchObject({ x: 0, y: 0 })
  const amShifts = strategy({ rects, activeIndex: 1, overIndex: 3, index: 3, activeNodeRect: null })
  expect(amShifts).toMatchObject({ x: 0, y: 0 })
})

it("groups chords into sections, ignoring a break at the end", () => {
  const names = (code: string) =>
    getSections(progression(code)).map((section) => section.map((p) => p.selectedChord.noteLetter))
  expect(names("(1C)(1G)(-)(1A)(1F)")).toEqual([["C", "G"], ["A", "F"]])
  expect(names("(1C)(1G)(-)")).toEqual([["C", "G"]])
  expect(names("")).toEqual([])
})
