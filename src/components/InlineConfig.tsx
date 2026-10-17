import React, { useState } from "react"
import { Guitar, LayoutGrid, Piano, Share, SlidersHorizontal } from "lucide-react"
import { useAppContext } from "../components/context/AppContext"
import { cn } from "../lib/utils"
import { withViewTransition } from "../utils/chordTransitions"
import { isGuitar } from "../utils/guitarUtil"
import { SegmentedToggle, ToggleOption } from "./SegmentedToggle"
import { ExportModal } from "./Layout/ExportModal"

const FORMAT_OPTIONS: ToggleOption[] = [
  { value: 'p', label: 'Piano', icon: <Piano className="h-4 w-4" /> },
  { value: 'g', label: 'Guitar', icon: <Guitar className="h-4 w-4" /> },
  { value: 'u', label: 'Ukulele', icon: <Guitar className="h-3.5 w-3.5" /> },
]

const FRET_VIEW_OPTIONS: ToggleOption[] = [
  { value: 'f', label: 'Full', icon: <SlidersHorizontal className="h-4 w-4" /> },
  { value: 't', label: 'Tab', icon: <LayoutGrid className="h-4 w-4" /> },
]

interface ToggleProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

// which instrument chords are displayed on
export const FormatToggle: React.FC<ToggleProps> = (props) => (
  <SegmentedToggle options={FORMAT_OPTIONS} label="Instrument" {...props} />
)

// full guitar/ukulele cards, or a compact chart of just names and tabs
export const FretViewToggle: React.FC<ToggleProps> = (props) => (
  <SegmentedToggle options={FRET_VIEW_OPTIONS} label="Chord view" {...props} />
)

/**
 * opens the export preview. sized and framed like the segmented toggles
 * above it, so the column reads as one set of controls
 */
const ExportButton: React.FC = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-[2.625rem] items-center gap-2 rounded-lg border border-border bg-card px-3.5",
          "text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        <Share className="h-4 w-4" />
        Export
      </button>
      <ExportModal open={open} onOpenChange={setOpen} />
    </>
  )
}

interface InlineConfigProps {
  className?: string
}

// inline configuration component for instrument and chord view selection
const InlineConfig: React.FC<InlineConfigProps> = ({ className = "" }) => {
  const { state, dispatch } = useAppContext()

  const handleFormatChange = (format: string) => {
    if (format === state.format) return
    const update = () => dispatch({
      type: 'UPDATE_UX_FORMAT',
      format: format
    })
    // guitar <-> ukulele keeps the cards, which crossfade their own charts
    // (see GuitarChord), so the page itself isn't transitioned
    if (isGuitar(format) && isGuitar(state.format)) update()
    else withViewTransition(update)
  }

  const handleFretViewChange = (fretView: string) => {
    if (fretView === state.fretView) return
    withViewTransition(() => dispatch({
      type: 'UPDATE_FRET_VIEW',
      fretView: fretView
    }))
  }

  const hasChords = Boolean(state.chordPianoSet?.length)

  return (
    <div className={cn("inline-format-toggle flex flex-col items-center gap-2", className)}>
      <FormatToggle value={state.format} onChange={handleFormatChange} />
      {isGuitar(state.format) && (
        <FretViewToggle value={state.fretView} onChange={handleFretViewChange} />
      )}
      {hasChords && <ExportButton />}
    </div>
  )
}

export default InlineConfig
