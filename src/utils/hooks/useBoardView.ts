import { useState } from "react"
import { ChordPiano } from "../chordPianoHandler"
import { getProgressionItems } from "../sectionBreaks"
import { isGuitar } from "../settings"

/** piano cards in a column, guitar/ukulele cards in a grid, or the tab view */
export type BoardLayout = "piano" | "fretted" | "chart"

export interface BoardView {
  /** changes when the board remounts: a new progression, or none at all */
  boardKey: string
  layout: BoardLayout
  /** changes when the chord list is swapped: a new board, or a new layout */
  viewKey: string
  /** the chords and breaks present when the view mounted, which arrive with it */
  initialIds: number[]
  initialBreakIds: number[]
  /** the view was swapped on the same board, so it runs the enter transition itself */
  formatSwitched: boolean
}

export const getBoardLayout = (format: string, fretView: string): BoardLayout =>
  !isGuitar(format) ? "piano" : fretView === "t" ? "chart" : "fretted"

const getBreakIds = (chords: ChordPiano[]): number[] =>
  getProgressionItems(chords).filter((item) => item.type === "break").map((item) => item.id)

/**
 * a view is the welcome screen or a board in one layout. chords already
 * present when a view mounts arrive with the view's own transition, so
 * only chords added after that get the chord-enter animation.
 *
 * switching format keeps the board (and the format toggle on it) mounted
 * and only swaps the chord list, which then runs the view transition
 * itself. guitar and ukulele share a layout, so switching between them
 * keeps the cards too and only their charts change. the tab view is a
 * layout of its own, so full <-> tab swaps the list as well.
 *
 * loading a new progression from the editor bumps the store's
 * generation, which remounts the board so it enters like a new view
 */
export function useBoardView(
  chords: ChordPiano[],
  generation: number,
  format: string,
  fretView: string
): BoardView {
  const boardKey = `${generation}-${chords.length > 0}`
  const layout = getBoardLayout(format, fretView)
  const viewKey = `${boardKey}-${layout}`

  const snapshot = (formatSwitched: boolean) => ({
    viewKey,
    boardKey,
    ids: chords.map((chordPiano) => chordPiano.id),
    breakIds: getBreakIds(chords),
    formatSwitched
  })

  const [view, setView] = useState(() => snapshot(false))
  if (view.viewKey !== viewKey) {
    setView(snapshot(view.boardKey === boardKey))
  }

  return {
    boardKey,
    layout,
    viewKey,
    initialIds: view.ids,
    initialBreakIds: view.breakIds,
    formatSwitched: view.formatSwitched
  }
}
