import { createContext } from "react"
import { useSortable } from "@dnd-kit/sortable"

// dnd-kit treats an id of 0 as missing in places, so cards and breaks sort
// by string ids and carry their own ids along as data
export const getSortableId = (pianoId: number): string => `chord-${pianoId}`

export const getSortableBreakId = (breakId: number): string => `break-${breakId}`

export type HandleProps = Pick<ReturnType<typeof useSortable>, "attributes" | "listeners" | "setActivatorNodeRef">

// lets a DragHandle anywhere inside a sortable item start its drag
export const DragHandleContext = createContext<HandleProps | null>(null)
