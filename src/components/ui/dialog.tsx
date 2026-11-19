import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "../../lib/utils"
import { EASE_OUT, EXIT_MS, prefersReducedMotion } from "../../utils/chordTransitions"

const ENTER_MS = 220

/*
  the dialog's enter and exit are run here with the web animations api
  rather than left to radix's Presence and css keyframes. Presence plays a
  css animation in the same frame that opening or closing does its heavy
  work (scroll lock and aria-hiding restyle the whole page, the export
  sheet renders, a saved progression rebuilds the board). when that frame
  ran long the animation's clock kept going, so it was over by the time
  anything painted and the dialog just appeared or vanished.

  instead the content stays mounted (forceMount) for as long as Dialog says
  it's present, and each animation is held on its first frame until a
  frame has been painted, then played, so it always runs its full length
*/
interface DialogPresence {
  open: boolean
  present: boolean
  onExited: () => void
}

const DialogPresenceContext = React.createContext<DialogPresence | null>(null)

const Dialog = ({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = openProp ?? uncontrolledOpen

  // true from opening until the content has finished animating out
  const [present, setPresent] = React.useState(open)
  if (open && !present) setPresent(true)

  const handleOpenChange = React.useCallback((next: boolean) => {
    if (openProp === undefined) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }, [openProp, onOpenChange])

  const onExited = React.useCallback(() => setPresent(false), [])
  const presence = React.useMemo(() => ({ open, present, onExited }), [open, present, onExited])

  return (
    <DialogPresenceContext.Provider value={presence}>
      <DialogPrimitive.Root {...props} open={open} onOpenChange={handleOpenChange} />
    </DialogPresenceContext.Provider>
  )
}

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

/**
 * fades the overlay and lifts the content in when the dialog opens, and
 * the reverse when it closes, calling onExited once the exit is done. a
 * reversal partway through starts from wherever the last one had got to
 */
function useDialogMotion(
  open: boolean,
  present: boolean,
  overlay: HTMLDivElement | null,
  content: HTMLDivElement | null,
  onExited: () => void
): void {
  const running = React.useRef<Animation[]>([])

  /*
    the elements come in as state, not refs: radix's Portal renders nothing
    until its own layout effect has run, so on a fresh open they're only
    attached a render after this effect first sees present. keying on them
    runs it again once they exist, still before the first paint
  */
  React.useLayoutEffect(() => {
    if (!present || !overlay || !content) {
      running.current = []
      return
    }

    if (typeof content.animate !== "function") {
      if (!open) onExited()
      return
    }

    // reduced motion keeps the fade but drops the movement
    const lift = prefersReducedMotion() ? "none" : "translateY(8px) scale(0.96)"
    const hidden: Record<"overlay" | "content", Keyframe> = { overlay: { opacity: 0 }, content: { opacity: 0, transform: lift } }
    const shown: Record<"overlay" | "content", Keyframe> = { overlay: { opacity: 1 }, content: { opacity: 1, transform: "none" } }

    const current = (el: HTMLElement): Keyframe => {
      const style = getComputedStyle(el)
      return { opacity: style.opacity, transform: style.transform }
    }
    const interrupted = running.current.some(a => a.playState !== "finished" && a.playState !== "idle")
    const from = open && !interrupted
      ? hidden
      : { overlay: { opacity: current(overlay).opacity }, content: current(content) }
    const to = open ? shown : hidden

    running.current.forEach(a => a.cancel())

    // the exit holds its last frame so nothing flashes before the unmount
    const timing: KeyframeAnimationOptions = open
      ? { duration: ENTER_MS, easing: EASE_OUT }
      : { duration: EXIT_MS, easing: "ease-in", fill: "forwards" }

    const animations = [
      overlay.animate([from.overlay, to.overlay], timing),
      content.animate([from.content, to.content], timing),
    ]
    running.current = animations

    // held on the first frame until the frame that opens or closes the
    // dialog, with all its restyling, has been painted
    animations.forEach(a => a.pause())
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => animations.forEach(a => a.play()))
    })

    if (!open) {
      // rejected when a reopen cancels the exit
      Promise.all(animations.map(a => a.finished)).then(onExited, () => {})
    }

    return () => cancelAnimationFrame(frame)
  }, [open, present, overlay, content, onExited])
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/60", className)}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, forwardedRef) => {
  const presence = React.useContext(DialogPresenceContext)
  const open = presence?.open ?? false
  const present = presence?.present ?? false
  const onExited = presence?.onExited ?? noop

  const [overlay, setOverlay] = React.useState<HTMLDivElement | null>(null)
  const [content, setContent] = React.useState<HTMLDivElement | null>(null)
  const ref = React.useCallback((node: HTMLDivElement | null) => {
    setContent(node)
    if (typeof forwardedRef === "function") forwardedRef(node)
    else if (forwardedRef) forwardedRef.current = node
  }, [forwardedRef])

  useDialogMotion(open, present, overlay, content, onExited)

  if (!present) return null

  return (
    <DialogPortal forceMount>
      <DialogOverlay ref={setOverlay} forceMount />
      <DialogPrimitive.Content
        ref={ref}
        forceMount
        className={cn(
          // centered by layout rather than a -50% translate, so the
          // animated transform doesn't depend on the dialog's size
          "fixed inset-0 z-50 m-auto grid h-fit w-full max-w-lg gap-5 border border-border bg-card p-5 text-card-foreground shadow-2xl shadow-black/40 sm:p-6 rounded-xl",
          "max-h-[85vh] max-w-[calc(100vw-2rem)]",
          className
        )}
        {...props}
      >
        {children}
        {/* inset by padding - 6px so the 28px button centers on the 16px title line */}
        <DialogPrimitive.Close className="absolute right-3.5 top-3.5 grid h-7 w-7 place-items-center rounded-md text-muted-foreground sm:right-[1.125rem] sm:top-[1.125rem] transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const noop = () => {}

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 pr-8 text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-base font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
