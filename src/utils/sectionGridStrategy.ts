import { ClientRect } from "@dnd-kit/core"
import { SortingStrategy, arrayMove } from "@dnd-kit/sortable"

export interface GridLayout {
  columns: number
  columnGap: number
  rowGap: number
  // per sortable item, in order: whether it spans a whole row (a section break)
  fullRow: boolean[]
}

export function measureGridLayout(grid: HTMLElement, fullRow: boolean[]): GridLayout {
  const style = getComputedStyle(grid)
  return {
    columns: Math.max(1, style.gridTemplateColumns.split(" ").filter(Boolean).length),
    columnGap: parseFloat(style.columnGap) || 0,
    rowGap: parseFloat(style.rowGap) || 0,
    fullRow
  }
}

type Spot = { left: number; top: number }

/**
 * lays the items out the way the grid will once they're in the new order:
 * cards fill the columns left to right, and a break closes the row it's on
 * and takes one of its own. cards keep the heights they were measured at
 */
function layOut(rects: ClientRect[], order: number[], layout: GridLayout): Spot[] {
  const { columns, columnGap, rowGap, fullRow } = layout
  // the first item is always a chord, so it marks the first column
  const first = rects[0]
  if (!first) return []
  const { left, top } = first
  const cardRect = rects.find((_, i) => !fullRow[i])
  const step = (cardRect?.width ?? 0) + columnGap

  const spots: Spot[] = []
  let y = top
  let column = 0
  let rowHeight = 0

  const endRow = () => {
    if (column === 0) return
    y += rowHeight + rowGap
    column = 0
    rowHeight = 0
  }

  for (const i of order) {
    const height = rects[i]?.height ?? 0
    if (fullRow[i]) {
      endRow()
      spots[i] = { left, top: y }
      y += height + rowGap
    } else {
      spots[i] = { left: left + column * step, top: y }
      rowHeight = Math.max(rowHeight, height)
      column++
      if (column === columns) endRow()
    }
  }

  return spots
}

/**
 * dnd-kit's rectSortingStrategy moves each item into the spot another item
 * held, which only works while every item fills one slot of a uniform
 * grid. section breaks span a whole row, so a card crossing one reflows the
 * rows after it; this works out where everything lands instead. the item
 * being dragged follows the pointer, so only the others use it
 */
export function createSectionGridStrategy(getLayout: () => GridLayout | null): SortingStrategy {
  let cache: { rects: ClientRect[]; activeIndex: number; overIndex: number; spots: Spot[] } | null = null

  return ({ rects, activeIndex, overIndex, index }) => {
    const layout = getLayout()
    const rect = rects[index]
    if (!layout || !rect || layout.fullRow.length !== rects.length) return null

    if (!cache || cache.rects !== rects || cache.activeIndex !== activeIndex || cache.overIndex !== overIndex) {
      const order = arrayMove(rects.map((_, i) => i), activeIndex, overIndex)
      cache = { rects, activeIndex, overIndex, spots: layOut(rects, order, layout) }
    }

    const spot = cache.spots[index]
    if (!spot) return null
    return {
      x: spot.left - rect.left,
      y: spot.top - rect.top,
      scaleX: 1,
      scaleY: 1
    }
  }
}
