import { flushSync } from "react-dom"

// same curve as the enter keyframes in Layout.css
const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)"
const EXIT_MS = 180
const SETTLE_MS = 300

const prefersReducedMotion = (): boolean =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false

/**
 * removes a chord card with an exit transition. the card fades out first,
 * then `remove` runs, and everything marked `data-flip` that moved to fill
 * the gap (the other cards, the format toggle) slides from where it was
 * into its new spot instead of jumping there
 */
export function removeChordWithTransition(pianoId: number, remove: () => void): void {
  const card = document.getElementById(`piano-${pianoId}`)

  if (!card || typeof card.animate !== "function" || prefersReducedMotion()) {
    remove()
    return
  }

  // ignore repeat clicks while the card is already leaving
  if (card.dataset.exiting) return
  card.dataset.exiting = "true"
  card.style.pointerEvents = "none"

  const exit = card.animate(
    [
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0, transform: "scale(0.97)" }
    ],
    { duration: EXIT_MS, easing: "ease-in", fill: "forwards" }
  )

  exit.finished.then(() => {
    // the board was rebuilt (undo, clear, format switch) while this played
    if (!card.isConnected) return

    const before = measureFlipTargets()
    // commit the removal now so the new layout can be measured before paint
    flushSync(remove)
    settleFlipTargets(before)
  }, () => {})
}

function measureFlipTargets(): Map<Element, DOMRect> {
  const rects = new Map<Element, DOMRect>()
  document.querySelectorAll("[data-flip]").forEach((el) => {
    rects.set(el, el.getBoundingClientRect())
  })
  return rects
}

// no fill mode: when the slide ends the element is left with no transform
function settleFlipTargets(before: Map<Element, DOMRect>): void {
  before.forEach((prev, el) => {
    if (!el.isConnected) return

    const next = el.getBoundingClientRect()
    const dx = prev.left - next.left
    const dy = prev.top - next.top
    if (!dx && !dy) return

    el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px)` },
        { transform: "none" }
      ],
      { duration: SETTLE_MS, easing: EASE_OUT }
    )
  })
}

let activeTransition: ViewTransition | null = null

/**
 * runs a state update inside a view transition where the browser supports
 * them, so the outgoing view crossfades into the incoming one instead of
 * being swapped out in a single frame. the update is flushed synchronously
 * so the new dom is in place when the transition captures it.
 *
 * `kind` is set as data-view-transition on the root element while the
 * transition runs, so Layout.css can style that kind of transition alone
 */
export function withViewTransition(update: () => void, kind?: string): void {
  if (typeof document.startViewTransition !== "function" || prefersReducedMotion()) {
    update()
    return
  }

  const root = document.documentElement
  // set before the old state is captured, and kept until the end
  if (kind) root.dataset.viewTransition = kind
  else delete root.dataset.viewTransition

  const transition = document.startViewTransition(() => flushSync(update))
  activeTransition = transition
  transition.finished.finally(() => {
    // a newer transition owns the attribute now
    if (activeTransition !== transition) return
    activeTransition = null
    delete root.dataset.viewTransition
  })
}
