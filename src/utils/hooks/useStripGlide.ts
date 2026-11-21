import React, { useCallback, useEffect, useRef } from "react"
import { prefersReducedMotion } from "../chordTransitions"

// how briskly the strip glides to where it's headed (a critically damped
// spring's natural frequency, per second): most of the way in about a
// quarter second, settling over half a second without overshooting
const STRIP_SPRING = 11

export type StripAxis = "left" | "top"

export interface StripGlide {
  glideTo: (axis: StripAxis, target: number) => void
  /** where the strip is headed, or where it is when it's not moving */
  destination: (axis: StripAxis) => number
  stop: () => void
}

const read = (strip: HTMLElement, axis: StripAxis) =>
  axis === "left" ? strip.scrollLeft : strip.scrollTop

const write = (strip: HTMLElement, axis: StripAxis, value: number) => {
  if (axis === "left") strip.scrollLeft = value
  else strip.scrollTop = value
}

/**
 * glides the strip to a scroll position. a new destination mid-glide
 * bends the strip's path from its current speed rather than starting over
 * from a standstill, as a smooth scrollBy would, so following the page
 * through a run of quick changes stays one continuous motion. it lets go
 * as soon as the user takes hold of the strip
 */
export function useStripGlide(stripRef: React.RefObject<HTMLDivElement | null>): StripGlide {
  const glideRef = useRef({ axis: "left" as StripAxis, target: 0, position: 0, velocity: 0, time: 0, frame: 0 })

  const stop = useCallback(() => {
    const glide = glideRef.current
    cancelAnimationFrame(glide.frame)
    glide.frame = 0
    glide.velocity = 0
  }, [])

  const step = useCallback((now: number) => {
    const strip = stripRef.current
    const glide = glideRef.current
    if (!strip) {
      glide.frame = 0
      return
    }

    // something else moved the strip, e.g. the user scrolling it
    if (Math.abs(read(strip, glide.axis) - glide.position) > 2) {
      stop()
      return
    }

    // a stalled frame (a background tab) carries on rather than leaping
    const dt = Math.min((now - glide.time) / 1000, 0.05)
    glide.time = now

    const max = glide.axis === "left"
      ? strip.scrollWidth - strip.clientWidth
      : strip.scrollHeight - strip.clientHeight
    const target = Math.min(max, Math.max(0, glide.target))

    // the spring's exact step, which holds steady at any frame rate
    const offset = glide.position - target
    const decay = Math.exp(-STRIP_SPRING * dt)
    const pull = (glide.velocity + STRIP_SPRING * offset) * dt
    glide.position = target + (offset + pull) * decay
    glide.velocity = (glide.velocity - STRIP_SPRING * pull) * decay

    if (Math.abs(glide.position - target) < 0.5 && Math.abs(glide.velocity) < 5) {
      glide.position = target
      write(strip, glide.axis, target)
      glide.frame = 0
      glide.velocity = 0
      return
    }

    write(strip, glide.axis, glide.position)
    glide.frame = requestAnimationFrame(step)
  }, [stripRef, stop])

  const glideTo = useCallback((axis: StripAxis, target: number) => {
    const strip = stripRef.current
    if (!strip) return
    const glide = glideRef.current

    if (prefersReducedMotion()) {
      stop()
      write(strip, axis, target)
      return
    }

    if (!glide.frame || glide.axis !== axis) {
      stop()
      if (Math.abs(target - read(strip, axis)) < 1) return
      glide.axis = axis
      glide.position = read(strip, axis)
      glide.time = performance.now()
      glide.frame = requestAnimationFrame(step)
    }
    glide.target = target
  }, [stripRef, step, stop])

  const destination = useCallback((axis: StripAxis) => {
    const strip = stripRef.current
    const glide = glideRef.current
    if (!strip) return 0
    return glide.frame && glide.axis === axis ? glide.target : read(strip, axis)
  }, [stripRef])

  useEffect(() => stop, [stop])

  return { glideTo, destination, stop }
}
