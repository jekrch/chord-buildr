import { prefersReducedMotion } from "./chordTransitions"

/**
 * how far below the header a chord scrolled to comes to rest. the board's
 * bottom spacer and the header's scroll-spy measure from the same line
 */
export const CHORD_SCROLL_GAP = 10

const DURATION_MS = 500

// what the user does to take the page back mid-scroll
const CANCEL_EVENTS = ["mousedown", "wheel", "touchmove", "keydown"] as const

// ease in and out over the whole scroll (quadratic)
const ease = (x: number): number =>
  x < 0.5 ? (x * 2) ** 2 / 2 : 1 - ((1 - x) * 2) ** 2 / 2

let cancelCurrent: (() => void) | undefined

/** the height of the fixed header, which a chord scrolled to sits below */
export const getHeaderHeight = (): number =>
  document.querySelector("nav")?.getBoundingClientRect().height ?? 0

/**
 * scrolls the page so the chord's card sits just below the header, over
 * half a second. a new scroll replaces one under way, and any wheel, touch,
 * key press or click lets go of the page
 */
export function scrollToChord(id: number): void {
  const card = document.getElementById(`piano-${id}`)
  if (!card) return

  const target = card.getBoundingClientRect().top + window.scrollY - getHeaderHeight() - CHORD_SCROLL_GAP
  scrollPageTo(target)
}

function scrollPageTo(target: number): void {
  cancelCurrent?.()

  const start = window.scrollY
  const delta = Math.round(target - start)
  if (delta === 0) return

  if (prefersReducedMotion()) {
    window.scrollTo(0, start + delta)
    return
  }

  let frame = 0
  let startTime: number | undefined

  const cancel = () => {
    cancelAnimationFrame(frame)
    CANCEL_EVENTS.forEach((type) => document.removeEventListener(type, cancel))
    if (cancelCurrent === cancel) cancelCurrent = undefined
  }

  const step = (now: number) => {
    startTime ??= now
    const progress = Math.min((now - startTime) / DURATION_MS, 1)
    window.scrollTo(0, start + Math.ceil(delta * ease(progress)))
    if (progress < 1) frame = requestAnimationFrame(step)
    else cancel()
  }

  CANCEL_EVENTS.forEach((type) => document.addEventListener(type, cancel, { passive: true }))
  cancelCurrent = cancel
  frame = requestAnimationFrame(step)
}
