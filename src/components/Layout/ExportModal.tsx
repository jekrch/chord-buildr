import React, { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { toPng } from "html-to-image"
import { Download, LayoutGrid, Loader2, Minus, Moon, Piano, Plus, Printer, Sun, TriangleAlert, Type } from "lucide-react"
import { useAppContext } from "../context/AppContext"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog"
import { SegmentedToggle, ToggleOption } from "../SegmentedToggle"
import { ExportSheet, SheetMode, SheetText, SheetTheme } from "../ExportSheet"
import { isGuitar } from "../../utils/guitarUtil"
import { cn } from "../../lib/utils"

interface ExportSettings {
  mode: SheetMode
  theme: SheetTheme
  text: SheetText
  // the chord content's size, in percent
  size: number
}

const EMPTY_SHEET_TEXT: SheetText = { title: "", subtitle: "", sections: [], notes: "" }

const DEFAULT_SETTINGS: ExportSettings = { mode: "diagrams", theme: "light", text: EMPTY_SHEET_TEXT, size: 100 }

const MIN_SIZE = 50
const MAX_SIZE = 160
const SIZE_STEP = 10

const clampSize = (size: unknown): number =>
  typeof size === "number" && Number.isFinite(size)
    ? Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(size / SIZE_STEP) * SIZE_STEP))
    : DEFAULT_SETTINGS.size

// kept for the tab's session, so closing the preview (or switching
// instrument, which remounts the board) doesn't lose what was typed, while
// a fresh visit starts from a clean, light sheet
const STORAGE_KEY = "chord-buildr-export"

function loadSettings(): ExportSettings {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null")
    if (saved) {
      return {
        ...DEFAULT_SETTINGS,
        ...saved,
        text: { ...EMPTY_SHEET_TEXT, ...saved.text },
        size: clampSize(saved.size)
      }
    }
  } catch {
    // storage blocked or unreadable; start fresh
  }
  return DEFAULT_SETTINGS
}

function saveSettings(settings: ExportSettings): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // not being remembered is fine
  }
}

const THEME_OPTIONS: ToggleOption[] = [
  { value: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
  { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> }
]

const getModeOptions = (format: string): ToggleOption[] => [
  { value: "chords", label: "Chords", icon: <Type className="h-4 w-4" /> },
  isGuitar(format)
    ? { value: "diagrams", label: "Tabs", icon: <LayoutGrid className="h-4 w-4" /> }
    : { value: "diagrams", label: "Keys", icon: <Piano className="h-4 w-4" /> }
]

const stepperButtonClass = cn(
  "grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors",
  "hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "disabled:pointer-events-none disabled:opacity-40"
)

interface SizeStepperProps {
  value: number
  onChange: (value: number) => void
}

/**
 * makes the chords and diagrams on the sheet bigger or smaller, framed
 * like the segmented toggles beside it. the percentage resets to 100%
 */
const SizeStepper: React.FC<SizeStepperProps> = ({ value, onChange }) => (
  <div role="group" aria-label="Chord size" className="inline-flex items-center rounded-lg border border-border bg-card p-1">
    <button
      type="button"
      className={stepperButtonClass}
      aria-label="Smaller"
      title="Smaller"
      disabled={value <= MIN_SIZE}
      onClick={() => onChange(clampSize(value - SIZE_STEP))}
    >
      <Minus className="h-4 w-4" />
    </button>
    <button
      type="button"
      className="h-8 min-w-[3.25rem] rounded-md px-1 text-sm font-medium tabular-nums text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Chord size ${value}%, reset to 100%`}
      title="Reset size"
      onClick={() => onChange(DEFAULT_SETTINGS.size)}
    >
      {value}%
    </button>
    <button
      type="button"
      className={stepperButtonClass}
      aria-label="Larger"
      title="Larger"
      disabled={value >= MAX_SIZE}
      onClick={() => onChange(clampSize(value + SIZE_STEP))}
    >
      <Plus className="h-4 w-4" />
    </button>
  </div>
)

const getFileName = (title: string): string =>
  (title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "chord-sheet") + ".png"

interface ExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * previews the progression as a chord sheet that can be titled, labelled
 * and annotated in place, then saved as an image or printed (which is
 * also how it's saved as a pdf).
 *
 * what's saved is a second, plain copy of the sheet rendered off screen at
 * a letter page's width, so the image doesn't pick up the inputs or depend
 * on how wide the preview happens to be. printing shows only that copy
 */
export const ExportModal: React.FC<ExportModalProps> = ({ open, onOpenChange }) => {
  const { state } = useAppContext()
  const [settings, setSettings] = useState(loadSettings)
  const [saving, setSaving] = useState(false)
  const captureRef = useRef<HTMLDivElement>(null)
  const { mode, theme, text, size } = settings
  // a dark page wastes ink and prints muddy, so only light sheets print
  const canPrint = theme === "light"
  const chordPianoSet = state.chordPianoSet ?? []

  useEffect(() => saveSettings(settings), [settings])

  const update = (changes: Partial<ExportSettings>) => setSettings((prev) => ({ ...prev, ...changes }))

  const handleDownload = async () => {
    const node = captureRef.current
    if (!node || saving) return

    setSaving(true)
    try {
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        // the app only uses system fonts, so there's nothing to embed
        skipFonts: true,
        backgroundColor: getComputedStyle(node).backgroundColor
      })
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = getFileName(text.title)
      link.click()
    } catch (error) {
      console.error("failed to export chord sheet:", error)
    } finally {
      setSaving(false)
    }
  }

  /**
   * the print styles hide everything but the off-screen copy while the
   * root carries data-exporting
   */
  const handlePrint = () => {
    if (!canPrint) return
    const root = document.documentElement
    root.setAttribute("data-exporting", "")

    const cleanup = () => {
      root.removeAttribute("data-exporting")
      window.removeEventListener("afterprint", cleanup)
    }
    window.addEventListener("afterprint", cleanup)
    window.print()
  }

  const sheetProps = { chordPianoSet, format: state.format, mode, theme, text, size }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:p-0",
          "max-h-none sm:h-[min(60rem,calc(100dvh-4rem))]"
        )}
        // focusing the first toggle would pop a ring on open; the sheet is
        // what the eye goes to
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border px-4 py-3 pr-12 sm:px-5 sm:pr-14">
          <div className="mr-auto min-w-0">
            <DialogTitle>Export</DialogTitle>
            <DialogDescription className="mt-1 hidden text-xs sm:block">
              Click any text on the sheet to edit it.
            </DialogDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedToggle
              options={getModeOptions(state.format)}
              label="Show"
              value={mode}
              onChange={(value) => update({ mode: value as SheetMode })}
            />
            <SegmentedToggle
              options={THEME_OPTIONS}
              label="Sheet theme"
              value={theme}
              onChange={(value) => update({ theme: value as SheetTheme })}
            />
            <SizeStepper value={size} onChange={(value) => update({ size: value })} />
          </div>
        </div>

        <div className="export-preview min-h-0 flex-1 overflow-y-auto overscroll-contain bg-muted/70 px-3 py-4 sm:px-8 sm:py-8">
          <ExportSheet {...sheetProps} onTextChange={(next) => update({ text: next })} />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-2.5 border-t border-border px-4 py-3 sm:px-5">
          {!canPrint && (
            <p role="status" className="mr-auto flex basis-full items-center gap-2 text-xs text-muted-foreground sm:basis-auto">
              <TriangleAlert className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
              Dark sheets can't be printed. Switch to Light to print.
            </p>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="pl-2.5 pr-3 sm:h-9 sm:px-4"
            onClick={handlePrint}
            disabled={!canPrint}
          >
            <Printer />
            Print / PDF
          </Button>
          <Button size="sm" className="pl-2.5 pr-3 sm:h-9 sm:px-4" onClick={handleDownload} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Download />}
            Download PNG
          </Button>
        </div>
      </DialogContent>

      {open && createPortal(
        <div className="export-offscreen" aria-hidden="true">
          <ExportSheet ref={captureRef} {...sheetProps} />
        </div>,
        document.body
      )}
    </Dialog>
  )
}
