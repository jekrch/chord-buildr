import type { JSX, ReactNode } from "react"
import { cn } from "../lib/utils"

/**
 * always mounted and collapsed by height rather than added and removed,
 * so opening it grows what holds it smoothly instead of snapping it to
 * the new size in one frame. closed, it takes no room, so a space-y gap
 * above it goes with it
 */
export function Collapsible({ open, children }: { open: boolean; children: ReactNode }): JSX.Element {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity,margin] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        open ? "grid-rows-[1fr] opacity-100" : "!mt-0 grid-rows-[0fr] opacity-0"
      )}
      inert={!open}
    >
      {/* -mx-1 px-1 leaves room for focus rings */}
      <div className="-mx-1 min-h-0 overflow-hidden px-1">
        {children}
      </div>
    </div>
  )
}
