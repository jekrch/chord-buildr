import React, { useRef } from "react"
import { flushSync } from "react-dom"
import { Plus } from "lucide-react"
import { useActions, useChords } from "../../store/progressionStore"
import { cn } from "../../lib/utils"
import { prefersReducedMotion } from "../../utils/chordTransitions"

const addButtonClass = cn(
  "flex h-11 items-center justify-center gap-1.5 rounded-[0.875rem]",
  "border border-dashed border-border text-sm text-muted-foreground",
  "transition-colors hover:border-primary/50 hover:bg-card/60 hover:text-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "disabled:pointer-events-none disabled:opacity-40"
)

/**
 * quiet dashed row after the last chord that tacks a new chord, or a
 * section break, onto the end. what's added lands where this row was and
 * pushes it down, so the row is kept in view afterwards, which also brings
 * the new card or break with it. a section can only end once, so the
 * break button rests while the progression already ends with one
 */
export const AddButtons: React.FC<{ className?: string }> = ({ className }) => {
  const chords = useChords()
  const { addChord, addSectionBreak } = useActions()
  const rowRef = useRef<HTMLDivElement>(null)
  const lastChordPiano = chords[chords.length - 1]
  const canAddBreak = lastChordPiano !== undefined && lastChordPiano.breakAfter === undefined

  // commit now so the new card or break is laid out before scrolling
  const keepInView = () => {
    rowRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "nearest"
    })
  }

  const handleAddChord = () => {
    flushSync(addChord)
    keepInView()
  }

  const handleAddBreak = () => {
    flushSync(addSectionBreak)
    keepInView()
  }

  return (
    <div ref={rowRef} data-flip className={cn("flex gap-2 sm:gap-3", className)}>
      <button type="button" onClick={handleAddChord} className={cn(addButtonClass, "flex-1")}>
        <Plus className="h-4 w-4" />
        Add chord
      </button>
      <button
        type="button"
        onClick={handleAddBreak}
        disabled={!canAddBreak}
        title="End the section here, so the next chord starts a new one"
        className={cn(addButtonClass, "w-[7.5rem] sm:w-36")}
      >
        <span className="section-slash section-slash--icon" aria-hidden="true" />
        Add break
      </button>
    </div>
  )
}
