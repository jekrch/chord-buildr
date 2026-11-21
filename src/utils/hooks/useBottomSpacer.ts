import { useLayoutEffect, useRef } from "react"
import { CHORD_SCROLL_GAP } from "../scrollToChord"

/**
 * sizes a spacer under the board so the page can scroll just far enough
 * for the last chord to reach the top (below the header), and no further.
 *
 * returns the refs to attach: the board (whose enter animation ends with
 * a re-measure), its content (watched for size changes) and the spacer.
 * `viewKey` re-measures when the board's view is swapped
 */
export function useBottomSpacer(navHeight: number, viewKey: string) {
  const boardRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const spacerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const board = boardRef.current
    const content = contentRef.current
    const spacer = spacerRef.current
    if (!board || !content || !spacer) return

    const updateSpacer = () => {
      const cards = content.querySelectorAll('[id^="piano-"]')
      const lastCard = cards[cards.length - 1]
      if (!lastCard) {
        spacer.style.height = "0px"
        return
      }
      const currentSpacer = spacer.getBoundingClientRect().height
      const lastCardTop = lastCard.getBoundingClientRect().top + window.scrollY
      const scrollHeightWithoutSpacer = document.documentElement.scrollHeight - currentSpacer
      // where scrolling to the chord from the header puts the page
      const targetScrollTop = lastCardTop - navHeight - CHORD_SCROLL_GAP
      const needed = targetScrollTop + window.innerHeight - scrollHeightWithoutSpacer
      spacer.style.height = `${Math.max(0, Math.ceil(needed))}px`
    }

    updateSpacer()
    const resizeObserver = new ResizeObserver(updateSpacer)
    resizeObserver.observe(content)
    window.addEventListener("resize", updateSpacer)
    // the first measurement is taken mid view-enter, offset by its lift
    board.addEventListener("animationend", updateSpacer)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", updateSpacer)
      board.removeEventListener("animationend", updateSpacer)
    }
  }, [navHeight, viewKey])

  return { boardRef, contentRef, spacerRef }
}
