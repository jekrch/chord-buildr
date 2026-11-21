import React, { useState } from "react"
import { Guitar, LayoutGrid, Piano, Share, SlidersHorizontal } from "lucide-react"
import { useActions, useAppStore, useSettings } from "../store/progressionStore"
import { cn } from "../lib/utils"
import { withViewTransition } from "../utils/chordTransitions"
import { isGuitar } from "../utils/settings"
import { preloadInstrument } from "../utils/instruments"
import { SegmentedToggle, ToggleOption } from "./SegmentedToggle"
import { lazyModal } from "./Layout/lazyModal"

const ExportModal = lazyModal(() => import("./Layout/ExportModal").then((m) => ({ default: m.ExportModal })))

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

// fetches the guitar and ukulele chord shapes as soon as a switch looks
// likely, so a picked instrument's charts are usually ready to draw
const preloadFrettedFormats = () => {
  preloadInstrument('g')
  preloadInstrument('u')
}

// which instrument chords are displayed on
export const FormatToggle: React.FC<ToggleProps> = (props) => (
  <SegmentedToggle options={FORMAT_OPTIONS} label="Instrument" onIntent={preloadFrettedFormats} {...props} />
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
  const settings = useSettings()
  const { setFormat, setFretView } = useActions()
  const hasChords = useAppStore((state) => state.chords.length > 0)

  const handleFormatChange = (format: string) => {
    if (format === settings.format) return
    const update = () => setFormat(format)
    // guitar <-> ukulele keeps the cards, which crossfade their own charts
    // (see GuitarChord), so the page itself isn't transitioned
    if (isGuitar(format) && isGuitar(settings.format)) update()
    else withViewTransition(update)
  }

  const handleFretViewChange = (fretView: string) => {
    if (fretView === settings.fretView) return
    withViewTransition(() => setFretView(fretView))
  }

  return (
    <div className={cn("inline-format-toggle flex flex-col items-center gap-2", className)}>
      <FormatToggle value={settings.format} onChange={handleFormatChange} />
      {isGuitar(settings.format) && (
        <FretViewToggle value={settings.fretView} onChange={handleFretViewChange} />
      )}
      {hasChords && <ExportButton />}
    </div>
  )
}

export default InlineConfig
