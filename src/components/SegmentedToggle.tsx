import React, { useLayoutEffect, useRef } from "react"
import { cn } from "../lib/utils"

export interface ToggleOption {
  value: string
  label: string
  icon: React.ReactNode
}

interface SegmentedToggleProps {
  options: ToggleOption[]
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
}

/**
 * segmented control with one option checked at a time. the selected
 * highlight is one element that slides to whichever option is checked,
 * rather than each option switching its own background
 */
export const SegmentedToggle: React.FC<SegmentedToggleProps> = ({ options, label, value, onChange, className }) => {
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
      aria-label={label}
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
      {options.map((option) => {
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
