import { useRef, useState, type JSX, type KeyboardEvent, type PointerEvent, type ReactNode } from "react"
import { Minus, Plus, Repeat, Repeat1, Shuffle } from "lucide-react"
import { arpeggioSteps } from "../audio/mix"
import {
  ARP_PATTERNS,
  ARP_SPEEDS,
  ARP_SUSTAINS,
  ArpOctaves,
  ArpPattern,
  ArpSpeed,
  ArpSustain,
  ArpeggioOptions,
  CUSTOM_MAX_STEPS,
  CUSTOM_MIN_STEPS,
  CUSTOM_ROWS,
  CustomPattern,
  DEFAULT_CUSTOM_PATTERN
} from "../utils/playPrefs"
import { SegmentedToggle, ToggleOption } from "./SegmentedToggle"
import { Collapsible } from "./Collapsible"
import { cn } from "../lib/utils"

interface ArpeggioControlsProps {
  value: ArpeggioOptions
  onChange: (next: Partial<ArpeggioOptions>) => void
}

const PATTERN_HINTS: Record<ArpPattern, string> = {
  up: "Low to high.",
  down: "High to low.",
  updown: "Up to the top note, then back down to the bass.",
  downup: "Down to the bass, then back up to the top note.",
  converge: "Lowest, highest, then inward, closing on the middle.",
  alberti: "Back to the top note between each of the others, like the classic left-hand figure.",
  random: "The bass first, then the rest in a new order each time.",
  custom: "Your own pattern. Tap or drag across the grid to place notes.",
}

const SUSTAIN_HINTS: Record<ArpSustain, string> = {
  ring: "Notes ring on and fade out together.",
  separate: "Each note lasts one step, so rests are heard.",
}

const SPEED_OPTIONS: ToggleOption[] = toOptions(ARP_SPEEDS)
const SUSTAIN_OPTIONS: ToggleOption[] = toOptions(ARP_SUSTAINS)
const OCTAVE_OPTIONS: ToggleOption[] = [
  { value: "1", label: "1 octave" },
  { value: "2", label: "2 octaves" },
]
const REPEAT_OPTIONS: ToggleOption[] = [
  { value: "once", label: "Once", icon: <Repeat1 className="h-3.5 w-3.5" /> },
  { value: "loop", label: "Loop", icon: <Repeat className="h-3.5 w-3.5" /> },
]

function toOptions(labels: Record<string, string>): ToggleOption[] {
  return Object.entries(labels).map(([value, label]) => ({ value, label }))
}

// the toggles fill their row, each option an even share of it
const ROW_TOGGLE = "flex w-full [&>button]:flex-1 [&>button]:justify-center [&>button]:px-2"

/**
 * the arpeggio's pattern, as a grid of tiles that each draw its shape,
 * a step grid for designing a custom one, and its speed, sustain and range
 */
export function ArpeggioControls({ value, onChange }: ArpeggioControlsProps): JSX.Element {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Arpeggio pattern">
          {(Object.keys(ARP_PATTERNS) as ArpPattern[]).map((pattern) => {
            const active = pattern === value.pattern
            return (
              <button
                key={pattern}
                type="button"
                aria-pressed={active}
                onClick={() => !active && onChange({ pattern })}
                className={cn(
                  "flex min-w-0 flex-col items-center gap-1.5 rounded-lg border px-1 pb-1.5 pt-2.5 text-xs font-medium transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-primary/70 bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/25 hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <span className={cn("grid h-5 place-items-center transition-colors duration-200", active && "text-primary")}>
                  <PatternGlyph pattern={pattern} custom={value.custom} />
                </span>
                <span className="max-w-full truncate">{ARP_PATTERNS[pattern]}</span>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">{PATTERN_HINTS[value.pattern]}</p>
      </div>

      <Collapsible open={value.pattern === "custom"}>
        <CustomPatternEditor pattern={value.custom} onChange={(custom) => onChange({ custom })} />
      </Collapsible>

      <OptionRow label="Speed">
        <SegmentedToggle
          options={SPEED_OPTIONS}
          label="Arpeggio speed"
          value={value.speed}
          onChange={(speed) => speed !== value.speed && onChange({ speed: speed as ArpSpeed })}
          className={ROW_TOGGLE}
        />
      </OptionRow>
      <OptionRow label="Notes" hint={SUSTAIN_HINTS[value.sustain]}>
        <SegmentedToggle
          options={SUSTAIN_OPTIONS}
          label="Arpeggio notes"
          value={value.sustain}
          onChange={(sustain) => sustain !== value.sustain && onChange({ sustain: sustain as ArpSustain })}
          className={ROW_TOGGLE}
        />
      </OptionRow>
      <OptionRow label="Range">
        <SegmentedToggle
          options={OCTAVE_OPTIONS}
          label="Arpeggio range"
          value={String(value.octaves)}
          onChange={(octaves) => {
            const next = Number(octaves) as ArpOctaves
            if (next !== value.octaves) onChange({ octaves: next })
          }}
          className={ROW_TOGGLE}
        />
      </OptionRow>
      <OptionRow
        label="Repeat"
        hint={value.loop
          ? "Plays until stopped. While a chord loops, its play button and the header's Play become Stop."
          : undefined}
      >
        <SegmentedToggle
          options={REPEAT_OPTIONS}
          label="Arpeggio repeat"
          value={value.loop ? "loop" : "once"}
          onChange={(repeat) => {
            const loop = repeat === "loop"
            if (loop !== value.loop) onChange({ loop })
          }}
          className={cn(ROW_TOGGLE, "[&>button]:gap-1.5")}
        />
      </OptionRow>
    </div>
  )
}

function OptionRow({ label, hint, children }: { label: string; hint?: string; children: ReactNode }): JSX.Element {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <span className="w-12 flex-shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      {hint && <p className="pl-[3.75rem] text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

// the rows top to bottom, so the bass sits at the bottom like a piano roll
const ROWS_DOWN = Array.from({ length: CUSTOM_ROWS }, (_, row) => CUSTOM_ROWS - 1 - row)

const hasNote = (pattern: CustomPattern, step: number, row: number): boolean =>
  pattern[step]?.includes(row) ?? false

// the pattern with a note placed or removed
function setNote(pattern: CustomPattern, step: number, row: number, on: boolean): CustomPattern {
  if (hasNote(pattern, step, row) === on) return pattern
  return pattern.map((rows, index) => {
    if (index !== step) return rows
    return on ? [...rows, row].sort((a, b) => a - b) : rows.filter((other) => other !== row)
  })
}

interface Cell {
  step: number
  row: number
}

// the cell a grid button stands for, from its data attributes
function cellOf(element: Element | null): Cell | null {
  const button = element?.closest<HTMLElement>("[data-step]")
  if (!button) return null
  return { step: Number(button.dataset.step), row: Number(button.dataset.row) }
}

/**
 * a step grid for a custom arpeggio: a column per step, a row per note
 * of the chord with the bass at the bottom. a press places or removes a
 * note, and dragging carries on doing the same across the cells it
 * passes over; the pattern is only handed on when the drag ends, so a
 * stroke previews once. the arrow keys move between cells and Space or
 * Enter toggles one, with only one cell in the tab order
 */
function CustomPatternEditor({
  pattern,
  onChange
}: {
  pattern: CustomPattern
  onChange: (pattern: CustomPattern) => void
}): JSX.Element {
  // the pattern while a stroke is being painted. the ref is what the
  // pointer handlers read, so a move never works from a stale render
  const [draft, setDraft] = useState<CustomPattern | null>(null)
  const draftRef = useRef<CustomPattern | null>(null)
  const updateDraft = (next: CustomPattern | null) => {
    draftRef.current = next
    setDraft(next)
  }
  // whether the stroke places notes or removes them
  const paint = useRef<boolean | null>(null)
  const [focused, setFocused] = useState<Cell>({ step: 0, row: 0 })
  const gridRef = useRef<HTMLDivElement>(null)

  const shown = draft ?? pattern
  const length = shown.length

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const cell = cellOf(event.target as Element)
    if (!cell) return
    event.preventDefault()
    const on = !hasNote(pattern, cell.step, cell.row)
    paint.current = on
    setFocused(cell)
    updateDraft(setNote(pattern, cell.step, cell.row, on))
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const on = paint.current
    if (on === null) return
    const cell = cellOf(document.elementFromPoint(event.clientX, event.clientY))
    const current = draftRef.current
    if (!cell || !current) return
    const next = setNote(current, cell.step, cell.row, on)
    if (next !== current) updateDraft(next)
  }

  const endStroke = () => {
    if (paint.current === null) return
    paint.current = null
    const stroke = draftRef.current
    updateDraft(null)
    if (stroke && stroke !== pattern) onChange(stroke)
  }

  const moveFocus = (cell: Cell) => {
    setFocused(cell)
    gridRef.current
      ?.querySelector<HTMLElement>(`[data-step="${cell.step}"][data-row="${cell.row}"]`)
      ?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const { step, row } = focused
    const moves: Record<string, Cell> = {
      ArrowRight: { step: Math.min(length - 1, step + 1), row },
      ArrowLeft: { step: Math.max(0, step - 1), row },
      ArrowUp: { step, row: Math.min(CUSTOM_ROWS - 1, row + 1) },
      ArrowDown: { step, row: Math.max(0, row - 1) },
      Home: { step: 0, row },
      End: { step: length - 1, row },
    }
    const next = moves[event.key]
    if (!next) return
    event.preventDefault()
    moveFocus(next)
  }

  const resize = (steps: number) => {
    const next = steps > length
      ? [...pattern, ...Array.from({ length: steps - length }, () => [])]
      : pattern.slice(0, steps)
    if (focused.step >= steps) setFocused({ ...focused, step: steps - 1 })
    onChange(next)
  }

  // the focused cell, kept inside the grid when steps are removed
  const focusStep = Math.min(focused.step, length - 1)

  return (
    <div className="space-y-2.5 rounded-xl border border-border bg-muted/20 p-3">
      <div
        ref={gridRef}
        role="grid"
        aria-label="Custom arpeggio"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onKeyDown={onKeyDown}
        className="grid touch-none select-none gap-[3px]"
        style={{ gridTemplateColumns: `1rem repeat(${length}, minmax(0, 1fr))` }}
      >
        {ROWS_DOWN.map((row) => (
          <div key={row} role="row" className="contents">
            <span
              aria-hidden="true"
              className="grid place-items-center text-[10px] tabular-nums text-muted-foreground"
            >
              {row + 1}
            </span>
            {shown.map((rows, step) => {
              const on = rows.includes(row)
              // every fourth step starts a beat, shaded to read the grid by
              const downbeat = step % 4 === 0
              return (
                <button
                  key={step}
                  type="button"
                  role="gridcell"
                  data-step={step}
                  data-row={row}
                  aria-pressed={on}
                  aria-label={`Step ${step + 1}, note ${row + 1}`}
                  tabIndex={step === focusStep && row === focused.row ? 0 : -1}
                  onFocus={() => setFocused({ step, row })}
                  // pointer presses are handled by the grid; this is Space and Enter
                  onClick={(event) => event.detail === 0 && onChange(setNote(pattern, step, row, !on))}
                  className={cn(
                    "h-5 min-w-0 rounded-[4px] transition-colors duration-100",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    on
                      ? "bg-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.2)] hover:bg-primary/85"
                      : downbeat
                        ? "bg-muted hover:bg-accent"
                        : "bg-muted/55 hover:bg-accent"
                  )}
                />
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1" role="group" aria-label="Steps">
          <span className="mr-1 text-xs text-muted-foreground">Steps</span>
          <StepButton label="Fewer steps" disabled={length <= CUSTOM_MIN_STEPS} onClick={() => resize(length - 1)}>
            <Minus className="h-3.5 w-3.5" />
          </StepButton>
          <span className="w-6 text-center text-xs font-medium tabular-nums" aria-live="polite">{length}</span>
          <StepButton label="More steps" disabled={length >= CUSTOM_MAX_STEPS} onClick={() => resize(length + 1)}>
            <Plus className="h-3.5 w-3.5" />
          </StepButton>
        </div>
        <div className="flex items-center gap-1">
          <TextButton onClick={() => onChange(pattern.map(() => []))}>Clear</TextButton>
          <TextButton onClick={() => onChange(DEFAULT_CUSTOM_PATTERN)}>Reset</TextButton>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Rows are the chord's notes from the bass up; past its top note they carry on up an octave.
        Stack notes in a step to play them together, or leave a step empty for a rest.
      </p>
    </div>
  )
}

function StepButton({
  label,
  disabled,
  onClick,
  children
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}): JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  )
}

function TextButton({ onClick, children }: { onClick: () => void; children: ReactNode }): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-7 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  )
}

const GLYPH_WIDTH = 44
const GLYPH_HEIGHT = 20
const GLYPH_PAD = 3
// the chord the built-in glyphs draw their pattern over
const GLYPH_NOTES = 4

/**
 * a pattern's shape, drawn the way a piano roll would show it: a dot per
 * note, left to right in time, higher notes higher, joined up when it's
 * one note at a time. random has no one shape, so it shows a shuffle;
 * custom draws the listener's own pattern
 */
function PatternGlyph({ pattern, custom }: { pattern: ArpPattern; custom: CustomPattern }): JSX.Element {
  if (pattern === "random") return <Shuffle className="h-4 w-4" aria-hidden="true" />

  const steps = pattern === "custom" ? custom : arpeggioSteps(GLYPH_NOTES, { pattern, custom })
  const rows = Math.max(2, ...steps.flat().map((row) => row + 1))
  const span = GLYPH_WIDTH - 2 * GLYPH_PAD
  const gap = span / Math.max(1, steps.length - 1)
  const radius = Math.min(2, Math.max(1.1, gap / 2.4))

  const dots = steps.flatMap((notes, step) => notes.map((row) => ({
    x: GLYPH_PAD + step * gap,
    y: GLYPH_HEIGHT - GLYPH_PAD - (row * (GLYPH_HEIGHT - 2 * GLYPH_PAD)) / (rows - 1),
  })))
  const melodic = steps.every((notes) => notes.length === 1)

  return (
    <svg
      width={GLYPH_WIDTH}
      height={GLYPH_HEIGHT}
      viewBox={`0 0 ${GLYPH_WIDTH} ${GLYPH_HEIGHT}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      {melodic && (
        <polyline
          points={dots.map(({ x, y }) => `${x},${y}`).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.35}
          strokeWidth={1.25}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {dots.map(({ x, y }, index) => (
        <circle key={index} cx={x} cy={y} r={radius} fill="currentColor" />
      ))}
    </svg>
  )
}
