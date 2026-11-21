import React, { useLayoutEffect, useRef } from "react"
import { cn } from "../lib/utils"

export interface TabOption<T extends string> {
  value: T
  label: string
  icon?: React.ReactNode
}

interface TabBarProps<T extends string> {
  tabs: readonly TabOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  // what the tab and panel ids are built from, so each tab and its
  // TabPanel point at each other. the same for both
  idBase: string
  className?: string
}

const tabId = (idBase: string, value: string): string => `${idBase}-tab-${value}`
const panelId = (idBase: string, value: string): string => `${idBase}-panel-${value}`

/**
 * a row of tabs, one selected at a time, with a pill that slides to
 * whichever is selected. the arrow keys, Home and End move between them,
 * selecting as they go; only the selected tab is in the tab order. each
 * tab's content goes in a TabPanel with the same idBase
 */
export function TabBar<T extends string>({
  tabs,
  value,
  onChange,
  label,
  idBase,
  className
}: TabBarProps<T>): React.JSX.Element {
  const listRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const list = listRef.current
    const indicator = indicatorRef.current
    if (!list || !indicator) return

    const place = () => {
      const selected = list.querySelector<HTMLElement>('[aria-selected="true"]')
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
    resizeObserver.observe(list)
    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
    }
  }, [value])

  const select = (index: number) => {
    const tab = tabs[(index + tabs.length) % tabs.length]
    if (!tab) return
    onChange(tab.value)
    document.getElementById(tabId(idBase, tab.value))?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    const current = tabs.findIndex((tab) => tab.value === value)
    const moves: Record<string, number> = {
      ArrowRight: current + 1,
      ArrowLeft: current - 1,
      Home: 0,
      End: tabs.length - 1
    }
    const next = moves[event.key]
    if (next === undefined) return
    event.preventDefault()
    select(next)
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        "relative flex rounded-xl bg-muted/60 p-1 ring-1 ring-inset ring-border/60",
        className
      )}
    >
      <span
        ref={indicatorRef}
        aria-hidden="true"
        className={cn(
          "absolute inset-y-1 left-0 rounded-lg bg-card shadow-sm ring-1 ring-border",
          "data-[ready]:transition-[transform,width] data-[ready]:duration-300",
          "data-[ready]:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        )}
      />
      {tabs.map((tab) => {
        const selected = tab.value === value
        return (
          <button
            key={tab.value}
            id={tabId(idBase, tab.value)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId(idBase, tab.value)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.value)}
            className={cn(
              "relative flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium transition-colors duration-300",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon && (
              <span
                className={cn(
                  // the icons only fit beside the labels on wider screens
                  "hidden w-4 place-items-center transition-colors duration-300 sm:grid",
                  selected && "text-primary"
                )}
              >
                {tab.icon}
              </span>
            )}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

interface TabPanelProps {
  idBase: string
  value: string
  selected: boolean
  className?: string
  children: React.ReactNode
}

/**
 * a tab's content. it stays mounted while another tab is selected, inert,
 * so the caller can fade it out rather than drop it
 */
export function TabPanel({ idBase, value, selected, className, children }: TabPanelProps): React.JSX.Element {
  return (
    <div
      id={panelId(idBase, value)}
      role="tabpanel"
      aria-labelledby={tabId(idBase, value)}
      inert={!selected}
      className={className}
    >
      {children}
    </div>
  )
}
