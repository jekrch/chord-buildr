import React, { useEffect, useState } from "react"
import { CHORD_SCROLL_GAP } from "../scrollToChord"

export interface ChordRange {
  first: number
  last: number
}

export interface VisibleChords {
  /** the first and last chords on screen, in board order */
  range: ChordRange | null
  /**
   * the chord whose card is under the line a chord scrolled to rests on,
   * just below the header. only tracked where the cards form one column
   */
  activeId: number | undefined
}

const NONE: VisibleChords = { range: null, activeId: undefined }

const CARD_SELECTOR = '[id^="piano-"]'

const cardId = (card: HTMLElement): number => Number(card.id.slice("piano-".length))

/**
 * tracks which chords are on screen between the header and footer, so the
 * strip can follow the page. this covers every layout, including the
 * guitar grid where several chords share a row.
 *
 * with `spy` on, it also tracks the card the page is scrolled to, for the
 * strip's underline. it's off for the grid layouts, where several cards
 * share the line
 *
 * `chords` and `layout` are only watched: the cards are re-measured when
 * either changes, as well as on scroll and resize
 */
export function useVisibleChordRange(
  headerRef: React.RefObject<HTMLElement | null>,
  chords: readonly unknown[],
  layout: string,
  spy: boolean
): VisibleChords {
  const [visible, setVisible] = useState<VisibleChords>(NONE)

  useEffect(() => {
    let frame = 0

    const measure = () => {
      frame = 0
      const top = headerRef.current?.getBoundingClientRect().bottom ?? 0
      const bottom = document.querySelector("footer")?.getBoundingClientRect().top ?? window.innerHeight
      const spyLine = top + CHORD_SCROLL_GAP
      let first: number | undefined
      let last: number | undefined
      let activeId: number | undefined

      document.querySelectorAll<HTMLElement>(CARD_SELECTOR).forEach(card => {
        const rect = card.getBoundingClientRect()
        if (rect.bottom > top + 8 && rect.top < bottom - 8) {
          const id = cardId(card)
          first ??= id
          last = id
        }
        // a card scrolled to rests with its top on the line, give or take
        // the rounding of the page's scroll position
        if (spy && activeId === undefined && spyLine + 1 >= rect.top && spyLine < rect.bottom) {
          activeId = cardId(card)
        }
      })

      setVisible(prev => {
        const range = first === undefined || last === undefined
          ? null
          : prev.range?.first === first && prev.range.last === last ? prev.range : { first, last }
        return range === prev.range && activeId === prev.activeId ? prev : { range, activeId }
      })
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    schedule()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [headerRef, chords, layout, spy])

  return visible
}
