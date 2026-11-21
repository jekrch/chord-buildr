import React from "react"
import { Eraser, Play, Plus, Undo2 } from "lucide-react"
import { useActions, useCanUndo, useChords } from "../../store/progressionStore"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"

interface HeaderActionsProps {
  /** plays the next chord in the progression */
  onPlay: () => void
  /** adds a chord at the end */
  onAdd: () => void
}

// icons carry a few px of empty space inside their box, so the leading
// padding is trimmed to keep icon + label optically centered
const actionButtonClass = "pl-2 pr-2.5 sm:h-9 sm:pl-3.5 sm:pr-4"

/**
 * the header's top row: play and add, then undo and clear
 */
export const HeaderActions: React.FC<HeaderActionsProps> = ({ onPlay, onAdd }) => {
  const hasChords = useChords().length > 0
  const canUndo = useCanUndo()
  const { clear, undo } = useActions()

  return (
    <div className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:gap-2.5 sm:py-3">
      <Button
        size="sm"
        // the filled triangle reads larger than the outline icons beside it
        className={cn(actionButtonClass, "[&_svg]:size-3.5")}
        onClick={onPlay}
        disabled={!hasChords}
      >
        <Play className="fill-current" />
        Play
      </Button>
      <Button
        size="sm"
        className={actionButtonClass}
        onClick={onAdd}
      >
        <Plus />
        Add
      </Button>
      <span className="mx-0.5 h-5 w-px bg-border sm:mx-1" aria-hidden="true" />
      <Button
        variant="secondary"
        size="sm"
        className={actionButtonClass}
        disabled={!canUndo}
        onClick={() => undo()}
      >
        <Undo2 />
        Undo
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className={actionButtonClass}
        disabled={!hasChords}
        onClick={() => clear()}
      >
        <Eraser />
        Clear
      </Button>
    </div>
  )
}
