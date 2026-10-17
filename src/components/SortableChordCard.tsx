import React, { createContext, useContext, useMemo } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { cn } from "../lib/utils"
import { prefersReducedMotion } from "../utils/chordTransitions"

// dnd-kit treats an id of 0 as missing in places, so cards sort by string
// ids and carry the piano id along as data
export const getSortableId = (pianoId: number): string => `chord-${pianoId}`

type HandleProps = Pick<ReturnType<typeof useSortable>, "attributes" | "listeners" | "setActivatorNodeRef">

// lets a DragHandle anywhere inside a sortable item start its drag
export const DragHandleContext = createContext<HandleProps | null>(null)

interface SortableChordCardProps {
  pianoId: number
  className?: string
  children: React.ReactNode
}

/**
 * a chord card that can be dragged to a new spot in the progression. only
 * its DragHandle starts a drag, so the keys, selects and diagram inside
 * stay clickable and touch scrolling over the card still scrolls the page.
 *
 * the card re-renders on every frame of a drag, but its children are the
 * same elements each time, so only the handle (through context) follows
 */
export const SortableChordCard: React.FC<SortableChordCardProps> = ({ pianoId, className, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: getSortableId(pianoId),
    data: { pianoId },
    transition: prefersReducedMotion() ? null : undefined
  })

  const handle = useMemo(
    () => ({ attributes, listeners, setActivatorNodeRef }),
    [attributes, listeners, setActivatorNodeRef]
  )

  return (
    <article
      ref={setNodeRef}
      id={`piano-${pianoId}`}
      className={cn("chord-card", isDragging && "is-dragging", className)}
      // translate only: scaling would squash cards of different heights
      style={{ transform: CSS.Translate.toString(transform), transition }}
      data-flip
    >
      <DragHandleContext.Provider value={handle}>
        {children}
      </DragHandleContext.Provider>
    </article>
  )
}

export const DragHandle: React.FC<{ className?: string; label?: string }> = ({ className, label = "Reorder chord" }) => {
  const handle = useContext(DragHandleContext)
  if (!handle) return null

  return (
    <button
      ref={handle.setActivatorNodeRef}
      type="button"
      className={cn("rail-button drag-handle", className)}
      title="Drag to reorder"
      {...handle.attributes}
      {...handle.listeners}
      aria-label={label}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  )
}
