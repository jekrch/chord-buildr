import React, { useMemo } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { X } from "lucide-react"
import { useAppContext } from "./context/AppContext"
import { withFlipTransition, prefersReducedMotion } from "../utils/chordTransitions"
import { cn } from "../lib/utils"
import { DragHandle, DragHandleContext } from "./SortableChordCard"

export const getSortableBreakId = (breakId: number): string => `break-${breakId}`

interface SectionBreakProps {
  // the chord the break comes after
  pianoId: number
  entering?: boolean
  className?: string
}

/**
 * the divider between two sections of the progression: a hairline that
 * fades out at both ends, broken by the same slash the header strip uses.
 * this one only shows the break, for the tab view, which is edited from
 * the header strip
 */
export const SectionBreak: React.FC<SectionBreakProps> = ({ entering, className }) => (
  <div className={cn("section-break", entering && "section-break-enter", className)} data-flip>
    <span className="section-break__mark" aria-hidden="true">
      <span className="section-slash" />
    </span>
  </div>
)

interface SortableSectionBreakProps extends SectionBreakProps {
  breakId: number
}

/**
 * a divider on the editable boards. it sorts with the chords: drag its
 * handle to move where the section ends, or drag a chord past it to move
 * that chord into the next section. the slash removes the break, turning
 * into an x on hover so that reads before the click
 */
export const SortableSectionBreak: React.FC<SortableSectionBreakProps> = ({ pianoId, breakId, entering, className }) => {
  const { dispatch } = useAppContext()
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: getSortableBreakId(breakId),
    data: { breakId },
    transition: prefersReducedMotion() ? null : undefined
  })

  const handle = useMemo(
    () => ({ attributes, listeners, setActivatorNodeRef }),
    [attributes, listeners, setActivatorNodeRef]
  )

  const handleRemove = (): void => {
    withFlipTransition(() => dispatch({ type: "TOGGLE_SECTION_BREAK", id: pianoId }))
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "section-break section-break--sortable",
        entering && "section-break-enter",
        isDragging && "is-dragging",
        className
      )}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      data-flip
    >
      <button
        type="button"
        className="section-break__mark"
        aria-label="Remove section break"
        title="Remove section break"
        onClick={handleRemove}
      >
        <span className="section-slash" aria-hidden="true" />
        <X className="section-break__remove" aria-hidden="true" />
      </button>
      <DragHandleContext.Provider value={handle}>
        <DragHandle className="section-break__handle" label="Move section break" />
      </DragHandleContext.Provider>
    </div>
  )
}
