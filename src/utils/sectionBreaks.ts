import { ChordPiano } from "./chordPianoHandler"

/**
 * the progression as the board lays it out and sorts it: the chords in
 * order, with each section break right after the chord it follows
 */
export type ProgressionItem =
  | { type: "chord"; id: number }
  | { type: "break"; id: number }

export function getProgressionItems(set: ChordPiano[] | undefined): ProgressionItem[] {
  return (set ?? []).flatMap((chordPiano): ProgressionItem[] =>
    chordPiano.breakAfter === undefined
      ? [{ type: "chord", id: chordPiano.id }]
      : [{ type: "chord", id: chordPiano.id }, { type: "break", id: chordPiano.breakAfter }]
  )
}

export function getNextBreakId(set: ChordPiano[] | undefined): number {
  const ids = (set ?? []).map((chordPiano) => chordPiano.breakAfter ?? -1)
  return Math.max(-1, ...ids) + 1
}

/**
 * true when a break at this spot would have nothing to separate: at the
 * start, or right next to another break
 */
export function isStrayBreak(items: ProgressionItem[], index: number): boolean {
  return (
    items[index]?.type === "break" &&
    (index === 0 || items[index - 1]?.type === "break" || items[index + 1]?.type === "break")
  )
}

/**
 * rebuilds the chord set from items in a new order, hanging each break on
 * the chord before it. a stray break (see isStrayBreak) is dropped, so a
 * section emptied by dragging its last chord out closes up. only chords
 * whose break changes are copied
 */
export function arrangeProgression(set: ChordPiano[], items: ProgressionItem[]): ChordPiano[] {
  const byId = new Map(set.map((chordPiano) => [chordPiano.id, chordPiano]))
  const arranged: ChordPiano[] = []
  const breaks: (number | undefined)[] = []

  for (const item of items) {
    if (item.type === "break") {
      if (arranged.length && breaks[arranged.length - 1] === undefined) {
        breaks[arranged.length - 1] = item.id
      }
      continue
    }

    const chordPiano = byId.get(item.id)
    if (chordPiano) arranged.push(chordPiano)
  }

  return arranged.map((chordPiano, i) =>
    chordPiano.breakAfter === breaks[i]
      ? chordPiano
      : { ...chordPiano, breakAfter: breaks[i] }
  )
}

/**
 * removes a chord. a break after it moves to the chord before, so the
 * sections around it stay apart, unless that chord already ends a section
 */
export function removeChord(set: ChordPiano[], id: number): ChordPiano[] {
  const items = getProgressionItems(set)
  const index = items.findIndex((item) => item.type === "chord" && item.id === id)
  if (index < 0) return set

  items.splice(index, 1)
  return arrangeProgression(set, items)
}

export function toggleBreakAfter(set: ChordPiano[], id: number): ChordPiano[] {
  const nextBreakId = getNextBreakId(set)
  return set.map((chordPiano) =>
    chordPiano.id !== id
      ? chordPiano
      : { ...chordPiano, breakAfter: chordPiano.breakAfter === undefined ? nextBreakId : undefined }
  )
}

/**
 * the chords grouped into their sections, in order. a break at the very
 * end closes the last section rather than opening an empty one
 */
export function getSections(set: ChordPiano[] | undefined): ChordPiano[][] {
  const sections: ChordPiano[][] = [[]]
  for (const chordPiano of set ?? []) {
    sections[sections.length - 1].push(chordPiano)
    if (chordPiano.breakAfter !== undefined) sections.push([])
  }
  return sections.filter((section) => section.length)
}
