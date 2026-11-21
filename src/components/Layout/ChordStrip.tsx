import React, { useLayoutEffect, useRef, useState } from "react"
import { ChevronDown, SquarePen } from "lucide-react"
import { ChordPiano } from "../../utils/chordPianoHandler"
import { getChordDisplay } from "../../codec"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"

interface ChordStripProps {
  stripRef: React.RefObject<HTMLDivElement | null>
  chords: readonly ChordPiano[]
  playingId: number | undefined
  /** the chord to underline */
  indicatorId: number | undefined
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  onChordClick: (id: number) => void
  /** the user took hold of the strip (a touch or a mouse wheel) */
  onStripGrabbed: () => void
  onEdit: () => void
}

/**
 * slides the strip's underline to a chord. when it has been hidden it
 * jumps straight to its spot (snap) and fades in instead of sliding over
 * from wherever it was last
 */
function useStripIndicator(
  rowRef: React.RefObject<HTMLDivElement | null>,
  id: number | undefined,
  chords: readonly ChordPiano[]
) {
  const [indicator, setIndicator] = useState({ x: 0, y: 0, width: 0, visible: false, snap: true })

  useLayoutEffect(() => {
    const row = rowRef.current
    if (!row) return

    const place = () => {
      const link = id === undefined
        ? null
        : row.querySelector<HTMLElement>(`[data-piano-id="${id}"]`)

      setIndicator(prev => {
        if (!link) return prev.visible ? { ...prev, visible: false } : prev

        // inset by the link's horizontal padding so the line sits under the text
        const next = {
          x: link.offsetLeft + 4,
          y: link.offsetTop + link.offsetHeight,
          width: link.offsetWidth - 8,
          visible: true,
          snap: !prev.visible
        }
        const unchanged = prev.visible && prev.x === next.x && prev.y === next.y && prev.width === next.width
        return unchanged ? prev : next
      })
    }

    place()
    // chords reflow when the strip wraps, the window resizes or fonts load
    const resizeObserver = new ResizeObserver(place)
    resizeObserver.observe(row)
    return () => resizeObserver.disconnect()
  }, [rowRef, id, chords])

  return indicator
}

/**
 * the strip keeps to one line and scrolls sideways, unless expanded to
 * wrap onto as many lines as it needs. the toggle only shows when there
 * is more than one line's worth: collapsed, when the chords run past the
 * strip; expanded, when they've wrapped. the edges fade on whichever
 * side has chords scrolled out of view
 */
function useStripOverflow(
  stripRef: React.RefObject<HTMLDivElement | null>,
  rowRef: React.RefObject<HTMLDivElement | null>,
  expanded: boolean,
  chords: readonly ChordPiano[],
  onStripGrabbed: () => void
) {
  const [overflow, setOverflow] = useState({ canToggle: false, start: false, end: false })

  useLayoutEffect(() => {
    const strip = stripRef.current
    const row = rowRef.current
    if (!strip || !row) return

    const measure = () => {
      let canToggle: boolean
      if (expanded) {
        const links = row.querySelectorAll<HTMLElement>("[data-piano-id]")
        const first = links[0]
        const last = links[links.length - 1]
        canToggle = first !== undefined && last !== undefined && last.offsetTop !== first.offsetTop
      } else {
        canToggle = strip.scrollWidth > strip.clientWidth + 1
      }
      const start = !expanded && strip.scrollLeft > 1
      const end = !expanded && strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1

      setOverflow(prev =>
        prev.canToggle === canToggle && prev.start === start && prev.end === end
          ? prev
          : { canToggle, start, end }
      )
    }

    // the scrollbar is hidden, so a mouse wheel scrolls the strip sideways
    const handleWheel = (e: WheelEvent) => {
      if (expanded || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      if (strip.scrollWidth <= strip.clientWidth) return
      e.preventDefault()
      onStripGrabbed()
      strip.scrollLeft += e.deltaY
    }

    // a glide toward the chords on screen lets go when the strip is touched
    const handleTouch = () => onStripGrabbed()

    measure()
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(strip)
    resizeObserver.observe(row)
    strip.addEventListener("scroll", measure, { passive: true })
    strip.addEventListener("wheel", handleWheel, { passive: false })
    strip.addEventListener("touchstart", handleTouch, { passive: true })
    return () => {
      resizeObserver.disconnect()
      strip.removeEventListener("scroll", measure)
      strip.removeEventListener("wheel", handleWheel)
      strip.removeEventListener("touchstart", handleTouch)
    }
  }, [stripRef, rowRef, expanded, chords, onStripGrabbed])

  return overflow
}

/**
 * a hairline between two chords, tilted into a slash where a section
 * break follows the first one. display only: breaks are added from the
 * board, since a clickable seam this close to the chords was too easy
 * to hit by mistake. the last chord only gets one when the progression
 * ends with a break
 */
const Seam: React.FC<{ isBreak: boolean }> = ({ isBreak }) => (
  <span className="chord-seam" data-break={isBreak || undefined} aria-hidden="true">
    <span className="section-slash" />
  </span>
)

/**
 * the header's second row: the progression's chords on one line (or
 * wrapped, when expanded), with an underline under the one playing or
 * scrolled to. clicking a chord plays it. the edit button opens the
 * progression as text
 */
export const ChordStrip: React.FC<ChordStripProps> = ({
  stripRef,
  chords,
  playingId,
  indicatorId,
  expanded,
  onExpandedChange,
  onChordClick,
  onStripGrabbed,
  onEdit
}) => {
  const rowRef = useRef<HTMLDivElement>(null)
  const indicator = useStripIndicator(rowRef, indicatorId, chords)
  const overflow = useStripOverflow(stripRef, rowRef, expanded, chords, onStripGrabbed)

  return (
    <div className="border-t border-border/70 bg-card/60">
      <div className="mx-auto flex min-h-11 max-w-[62rem] items-center gap-1 px-2 py-1 sm:px-4">
        {/* mirrors the trailing buttons so the strip stays centered on
            the page. dropped while a collapsed strip overflows: it then
            scrolls from its left edge, so the room matters more than
            symmetry (and the strip keeps the same width either way, as
            the chevron appears exactly when the spacer goes) */}
        {(!overflow.canToggle || expanded) && (
          <div className="flex shrink-0 gap-1" aria-hidden="true">
            {overflow.canToggle && <span className="size-8" />}
            <span className="size-8" />
          </div>
        )}
        {/* the edge fade masks this wrapper rather than the scroller
            itself, which mobile browsers can leave unpainted after a
            view transition (an instrument switch) */}
        <div
          className="chord-strip-fade min-w-0 flex-1"
          data-overflow={(!expanded && overflow.canToggle) || undefined}
          data-fade-start={overflow.start || undefined}
          data-fade-end={overflow.end || undefined}
        >
          <div
            ref={stripRef}
            className={cn(
              "chord-strip py-1.5",
              expanded ? "max-h-[40vh] overflow-y-auto" : "overflow-x-auto"
            )}
          >
            <div
              ref={rowRef}
              className={cn(
                "relative flex items-center gap-y-2",
                // w-max + mx-auto centers a short strip and starts a long
                // one at its left edge, where justify-center would cut it
                // off. the padding keeps the first and last chords clear
                // of the strip's edges and their fade
                expanded ? "flex-wrap justify-center px-2" : "mx-auto w-max px-4"
              )}
            >
              {chords.length ? (
                chords.map((piano, i) => {
                  const isBreak = piano.breakAfter !== undefined
                  const isLast = i === chords.length - 1
                  return (
                    <div key={`ci-${piano.id}`} className="flex items-center">
                      <button
                        type="button"
                        className={cn("chord-link", piano.id === playingId && "is-playing")}
                        data-piano-id={piano.id}
                        onClick={() => onChordClick(piano.id)}
                      >
                        {getChordDisplay(piano.selectedChord)}
                      </button>
                      {(!isLast || isBreak) && <Seam isBreak={isBreak} />}
                    </div>
                  )
                })
              ) : (
                <span className="text-sm text-muted-foreground">No chords yet</span>
              )}
              <span
                className="chord-indicator"
                aria-hidden="true"
                data-snap={indicator.snap.toString()}
                style={{
                  width: indicator.width,
                  transform: `translate(${indicator.x}px, ${indicator.y}px)`,
                  opacity: indicator.visible ? 1 : 0
                }}
              />
            </div>
          </div>
        </div>
        {overflow.canToggle && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            aria-expanded={expanded}
            aria-label={expanded ? "Show chords on one line" : "Show all chords"}
            title={expanded ? "Collapse" : "Show all chords"}
            onClick={() => onExpandedChange(!expanded)}
          >
            <ChevronDown
              className={cn("transition-transform duration-300 motion-reduce:transition-none", expanded && "rotate-180")}
            />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          aria-label="Edit progression as text"
          title="Edit progression as text"
          onClick={onEdit}
        >
          <SquarePen />
        </Button>
      </div>
    </div>
  )
}
