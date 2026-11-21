import React, { useMemo, useRef } from "react"
import {
  Active,
  Announcements,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  Modifier,
  Over,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable"
import { useActions, useChords } from "../../store/progressionStore"
import { getChordDisplay } from "../../codec"
import { getSortableBreakId, getSortableId } from "./sortable"
import { getProgressionItems, isStrayBreak } from "../../utils/sectionBreaks"
import { GridLayout, createSectionGridStrategy, measureGridLayout } from "../../utils/sectionGridStrategy"

interface ProgressionDndProps {
  /** the piano board is a column, the fretted board a grid */
  layout: "piano" | "fretted"
  /** the fretted board's grid, measured when a drag starts */
  gridRef: React.RefObject<HTMLDivElement | null>
  children: React.ReactNode
}

// the piano board is a single column, so its cards only move up and down
const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 })

const getPianoId = (item: Active | Over | null): number | undefined => item?.data.current?.pianoId

/**
 * lets the cards and section breaks be dragged into a new order, which is
 * saved on the drop.
 *
 * cards are dragged by their handle: with a mouse once it moves a few
 * px (so a stray click doesn't pick one up), with touch right away since
 * the handle doesn't scroll the page, and with the keyboard by focusing
 * the handle, pressing space, moving with the arrow keys and pressing
 * space again (escape puts it back)
 */
export const ProgressionDnd: React.FC<ProgressionDndProps> = ({ layout, gridRef, children }) => {
  const chords = useChords()
  const { arrangeProgression } = useActions()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // chords and section breaks sort together, each break after its chord
  const items = useMemo(() => getProgressionItems(chords), [chords])
  const sortableIds = useMemo(
    () => items.map((item) => item.type === "chord" ? getSortableId(item.id) : getSortableBreakId(item.id)),
    [items]
  )

  /**
   * the fretted grid gives breaks a row of their own, so it measures its
   * columns and gaps when a drag starts to work out where things land
   */
  const gridLayoutRef = useRef<GridLayout | null>(null)
  const sectionGridStrategy = useMemo(() => createSectionGridStrategy(() => gridLayoutRef.current), [])

  const handleDragStart = () => {
    gridLayoutRef.current = gridRef.current
      ? measureGridLayout(gridRef.current, items.map((item) => item.type === "break"))
      : null
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    gridLayoutRef.current = null
    if (!over || active.id === over.id) return

    const from = sortableIds.indexOf(String(active.id))
    const to = sortableIds.indexOf(String(over.id))
    if (from < 0 || to < 0) return

    // a break dropped where it has nothing to separate goes back
    const arranged = arrayMove(items, from, to)
    if (isStrayBreak(arranged, to)) return

    arrangeProgression(arranged)
  }

  const handleDragCancel = () => {
    gridLayoutRef.current = null
  }

  // nothing is reordered until the drop, so the slot an item is over is
  // where it will land
  const describeItem = (item: Active | Over | null) => {
    if (item?.data.current?.breakId !== undefined) return "Section break"
    const chordPiano = chords.find((p) => p.id === getPianoId(item))
    return chordPiano ? getChordDisplay(chordPiano.selectedChord) : "Chord"
  }
  const describePosition = (item: Active | Over | null) => {
    const index = item ? sortableIds.indexOf(String(item.id)) : -1
    return `position ${index + 1} of ${sortableIds.length}`
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Picked up ${describeItem(active)} at ${describePosition(active)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${describeItem(active)} moved to ${describePosition(over)}.` : "",
    onDragEnd: ({ active, over }) =>
      `${describeItem(active)} dropped at ${describePosition(over ?? active)}.`,
    onDragCancel: ({ active }) =>
      `Reordering cancelled. ${describeItem(active)} returned to ${describePosition(active)}.`
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={layout === "piano" ? [restrictToVerticalAxis] : undefined}
      accessibility={{ announcements }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={sortableIds}
        strategy={layout === "piano" ? verticalListSortingStrategy : sectionGridStrategy}
      >
        {children}
      </SortableContext>
    </DndContext>
  )
}
