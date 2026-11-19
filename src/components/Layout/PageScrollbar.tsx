import { useEffect, useRef } from "react"
import useNavHeight from "../../utils/hooks/useNavHeight"

// matches the footer's h-12
const FOOTER_HEIGHT = 48
const MIN_THUMB = 28

/*
  the page scrolls in the window, so its native scrollbar runs the full
  height of the window, alongside the fixed header and footer. on mouse
  devices (see .page-scrollbar in index.css) that one is hidden and this
  draws its stand-in in the gap between the two bars. it only mirrors and
  drives window scrolling: the wheel, keyboard and touch all scroll the
  page as before. since nothing takes layout width, the page and the bars
  don't shift when the content grows past the window. touch devices keep
  their native overlay scrollbar and this stays hidden
*/
const PageScrollbar: React.FC = () => {
  const navHeight = useNavHeight("nav")
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    const thumb = thumbRef.current
    if (!track || !thumb) return

    const root = document.documentElement
    let frame = 0

    // the thumb's size and the scroll distance one px of track is worth
    const measure = () => {
      const trackHeight = track.clientHeight
      const viewHeight = window.innerHeight
      const maxScroll = root.scrollHeight - viewHeight
      const thumbHeight = maxScroll > 0
        ? Math.max(MIN_THUMB, Math.round(trackHeight * (viewHeight / root.scrollHeight)))
        : 0
      return { trackHeight, maxScroll, thumbHeight, travel: trackHeight - thumbHeight }
    }

    const update = () => {
      frame = 0
      const { maxScroll, thumbHeight, travel } = measure()
      if (maxScroll <= 0 || travel <= 0) {
        track.dataset.hidden = ""
        return
      }
      delete track.dataset.hidden
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll))
      thumb.style.height = `${thumbHeight}px`
      thumb.style.transform = `translate3d(0, ${Math.round(progress * travel)}px, 0)`
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    // dragging the thumb scrolls the page by the same proportion
    let drag: { pointerId: number; startY: number; startScroll: number; ratio: number } | null = null

    const onThumbDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      const { maxScroll, travel } = measure()
      if (travel <= 0) return
      drag = { pointerId: e.pointerId, startY: e.clientY, startScroll: window.scrollY, ratio: maxScroll / travel }
      thumb.setPointerCapture(e.pointerId)
      track.dataset.dragging = ""
    }

    const onThumbMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.pointerId) return
      window.scrollTo({ top: drag.startScroll + (e.clientY - drag.startY) * drag.ratio, behavior: "instant" })
    }

    const onThumbUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.pointerId) return
      drag = null
      delete track.dataset.dragging
    }

    // clicking the track pages toward the click, like the native one
    const onTrackDown = (e: PointerEvent) => {
      if (e.button !== 0 || e.target !== track) return
      e.preventDefault()
      const above = e.clientY < thumb.getBoundingClientRect().top
      window.scrollBy({ top: (above ? -1 : 1) * window.innerHeight * 0.9, behavior: "smooth" })
    }

    thumb.addEventListener("pointerdown", onThumbDown)
    thumb.addEventListener("pointermove", onThumbMove)
    thumb.addEventListener("pointerup", onThumbUp)
    thumb.addEventListener("pointercancel", onThumbUp)
    track.addEventListener("pointerdown", onTrackDown)
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    // content growing or shrinking changes the page's scroll height
    const resizeObserver = new ResizeObserver(schedule)
    resizeObserver.observe(document.body)
    resizeObserver.observe(track)
    update()

    return () => {
      cancelAnimationFrame(frame)
      thumb.removeEventListener("pointerdown", onThumbDown)
      thumb.removeEventListener("pointermove", onThumbMove)
      thumb.removeEventListener("pointerup", onThumbUp)
      thumb.removeEventListener("pointercancel", onThumbUp)
      track.removeEventListener("pointerdown", onTrackDown)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div
      ref={trackRef}
      className="page-scrollbar"
      style={{ top: navHeight, bottom: FOOTER_HEIGHT }}
      aria-hidden="true"
      data-hidden=""
    >
      <div ref={thumbRef} className="page-scrollbar-thumb" />
    </div>
  )
}

export default PageScrollbar
