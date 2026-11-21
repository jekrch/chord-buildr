import React, { useCallback, useEffect, useRef, useState } from "react"
import { ChordRange } from "./useVisibleChordRange"
import { StripGlide } from "./useStripGlide"

// how far a chord the strip scrolls to is kept from its edges, clear of
// their fade
const STRIP_INSET = 32

const SCROLL_KEYS = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]
const RESUME_EVENTS = ["wheel", "touchmove", "keydown", "pointerdown"]

interface StripFollowOptions {
  stripRef: React.RefObject<HTMLDivElement | null>
  glide: StripGlide
  /** the chords on screen */
  range: ChordRange | null
  playingId: number | undefined
  expanded: boolean
  /** the chord ids in order, joined, so a change to them is a new string */
  chordOrder: string
}

/**
 * keeps the strip scrolled to the chords on screen: centered when they
 * fit, or from the first one when they don't. an expanded strip that's
 * capped in height scrolls up and down instead. it only reacts to the
 * chords being added, removed or moved, not to one starting to play.
 *
 * playing a chord leaves the strip where it is, even though playing from
 * the strip or the play button scrolls the page to the chord, so what was
 * just clicked doesn't slide away from under the pointer. it only moves
 * as far as it must to keep every chord on screen in view. the strip
 * picks up following again once the user scrolls the page themselves (a
 * scroll of the strip itself doesn't count).
 *
 * when following resumes after a pause, the strip doesn't jump to its
 * spot. it keeps its distance from it as an offset and moves on from
 * where it is, by the same steps it would have taken anyway, while the
 * offset shrinks with every bit the page is scrolled (to about a third
 * per screen height), so it eases back into place. paused or not, the
 * chords on screen all stay in view whenever they fit.
 *
 * returns `pause`, for playing a chord from the header: it has to pause
 * before the page starts scrolling to the chord, which can be before the
 * chord is marked as playing
 */
export function useStripFollow({
  stripRef,
  glide,
  range,
  playingId,
  expanded,
  chordOrder
}: StripFollowOptions): { pause: () => void } {
  const { glideTo, destination, stop } = glide
  const [paused, setPaused] = useState(false)
  // how far the strip sits from where following would put it, and the
  // page position that was last measured from
  const offsetRef = useRef(0)
  const pageYRef = useRef(0)
  const resumingRef = useRef(false)

  const pause = useCallback(() => setPaused(true), [])

  useEffect(() => {
    if (playingId !== undefined) setPaused(true)
  }, [playingId])

  useEffect(() => {
    if (!paused) return

    const resume = (e: Event) => {
      if (e.target instanceof Node && stripRef.current?.contains(e.target)) return
      if (e instanceof KeyboardEvent && !SCROLL_KEYS.includes(e.key)) return
      // a press on the page's own scrollbar lands on the root element
      if (e.type === "pointerdown" && e.target !== document.documentElement) return
      resumingRef.current = true
      setPaused(false)
    }

    RESUME_EVENTS.forEach(type => window.addEventListener(type, resume, { passive: true }))
    return () => RESUME_EVENTS.forEach(type => window.removeEventListener(type, resume))
  }, [paused, stripRef])

  // adding, removing or moving chords shows the change, paused or not
  useEffect(() => {
    offsetRef.current = 0
    setPaused(false)
  }, [chordOrder])

  // expanding or collapsing the strip switches which way it scrolls, and
  // starts following afresh
  useEffect(() => {
    offsetRef.current = 0
    stop()
  }, [expanded, stop])

  const first = range?.first
  const last = range?.last

  useEffect(() => {
    const strip = stripRef.current
    if (!strip || first === undefined || last === undefined) return

    const firstLink = strip.querySelector(`[data-piano-id="${first}"]`)
    const lastLink = strip.querySelector(`[data-piano-id="${last}"]`)
    if (!firstLink || !lastLink) return

    const view = strip.getBoundingClientRect()
    const a = firstLink.getBoundingClientRect()
    const b = lastLink.getBoundingClientRect()

    if (expanded) {
      // up and down only as far as it takes to bring the chords into view,
      // measured from where the strip is headed if it's already moving
      const headedBy = destination("top") - strip.scrollTop
      const aTop = a.top - view.top - headedBy
      const bBottom = b.bottom - view.bottom - headedBy
      let top = 0
      if (aTop < 0) top = aTop - 8
      else if (bBottom > 0) top = Math.min(bBottom + 8, aTop - 8)
      if (Math.abs(top) >= 1) glideTo("top", strip.scrollTop + headedBy + top)
      return
    }

    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

    // the chords on screen, in the strip's scroll coordinates
    const start = a.left - view.left + strip.scrollLeft
    const end = b.right - view.left + strip.scrollLeft
    const maxLeft = strip.scrollWidth - strip.clientWidth
    const fits = end - start <= view.width - STRIP_INSET * 2

    const target = clamp(fits ? (start + end) / 2 - view.width / 2 : start - STRIP_INSET, 0, maxLeft)

    // every position that keeps all of them in view, or the one that
    // starts from the first when they're too many to fit
    const low = fits ? end + STRIP_INSET - view.width : start - STRIP_INSET
    const high = start - STRIP_INSET

    // the playing chord, with its underline, has to be in view above all,
    // e.g. one played from a card further down than the strip can reach
    // while it shows the chords on screen from the first
    const playing = playingId === undefined
      ? null
      : strip.querySelector(`[data-piano-id="${playingId}"]`)?.getBoundingClientRect()
    const playingLow = playing ? playing.right - view.left + strip.scrollLeft + STRIP_INSET - view.width : -Infinity
    const playingHigh = playing ? playing.left - view.left + strip.scrollLeft - STRIP_INSET : Infinity

    const keepInView = (left: number) =>
      clamp(clamp(clamp(left, low, high), playingLow, playingHigh), 0, maxLeft)

    // where the strip is already gliding to, so a glide under way isn't
    // pulled up short
    const current = destination("left")

    let next: number
    // a chord starting to play pauses following too, but that's only set
    // after this runs, so playing counts as paused here already
    if (paused || playing) {
      // stay put, short of letting a chord on screen fall out of view
      next = keepInView(current)
    } else if (resumingRef.current) {
      resumingRef.current = false
      pageYRef.current = window.scrollY
      next = keepInView(current)
      offsetRef.current = next - target
    } else {
      const scrolled = Math.abs(window.scrollY - pageYRef.current)
      pageYRef.current = window.scrollY
      let offset = offsetRef.current * Math.exp(-scrolled / window.innerHeight)
      if (Math.abs(offset) < 4) offset = 0
      next = keepInView(target + offset)
      // whatever keeping the chords in view took off the offset stays off
      offsetRef.current = next - target
    }

    if (Math.abs(next - current) >= 1) glideTo("left", next)
  }, [stripRef, first, last, expanded, chordOrder, paused, playingId, glideTo, destination])

  return { pause }
}
