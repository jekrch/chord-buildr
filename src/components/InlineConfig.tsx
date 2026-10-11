import React, { useLayoutEffect, useRef } from "react"
import { Guitar, Piano } from "lucide-react"
import { useAppContext } from "../components/context/AppContext"
import { cn } from "../lib/utils"
import { withViewTransition } from "../utils/chordTransitions"
import { isGuitar } from "../utils/guitarUtil"

const FORMAT_OPTIONS = [
  { value: 'p', label: 'Piano', icon: <Piano className="h-4 w-4" /> },
  { value: 'g', label: 'Guitar', icon: <Guitar className="h-4 w-4" /> },
  { value: 'u', label: 'Ukulele', icon: <Guitar className="h-3.5 w-3.5" /> },
]

interface FormatToggleProps {
  value: string
  onChange: (format: string) => void
  className?: string
}

/**
 * segmented control for choosing which instrument chords are displayed on.
 * the selected highlight is one element that slides to whichever option
 * is checked, rather than each option switching its own background
 */
export const FormatToggle: React.FC<FormatToggleProps> = ({ value, onChange, className }) => {
  const groupRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const group = groupRef.current
    const indicator = indicatorRef.current
    if (!group || !indicator) return

    const place = () => {
      const selected = group.querySelector<HTMLElement>('[aria-checked="true"]')
      indicator.hidden = !selected
      if (!selected) return
      indicator.style.width = `${selected.offsetWidth}px`
      indicator.style.transform = `translateX(${selected.offsetLeft}px)`
    }

    place()
    // the first placement lands without sliding in from the left edge
    const frame = requestAnimationFrame(() => {
      indicator.dataset.ready = "true"
    })
    const resizeObserver = new ResizeObserver(place)
    resizeObserver.observe(group)
    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
    }
  }, [value])

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label="Instrument"
      className={cn("relative inline-flex rounded-lg border border-border bg-card p-1", className)}
    >
      <span
        ref={indicatorRef}
        aria-hidden="true"
        className={cn(
          "absolute inset-y-1 left-0 rounded-md bg-secondary shadow-sm ring-1 ring-inset ring-border",
          "data-[ready]:transition-[transform,width] data-[ready]:duration-300",
          "data-[ready]:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        )}
      />
      {FORMAT_OPTIONS.map((option) => {
        const selected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-300",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "grid w-4 place-items-center transition-colors duration-300",
                selected && "text-primary"
              )}
            >
              {option.icon}
            </span>
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

interface InlineConfigProps {
  className?: string
}

// inline configuration component for instrument selection
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

  return (
    <div className={cn("inline-format-toggle flex justify-center", className)}>
      <FormatToggle value={state.format} onChange={handleFormatChange} />
    </div>
  )
}

export default InlineConfig
