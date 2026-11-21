import React, { useCallback, useEffect, useState, useLayoutEffect, useMemo, useRef, memo } from "react"
import { flushSync } from "react-dom"
import { Plus } from "lucide-react"
import {
  Active,
  Announcements,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  Modifier,
  Over,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable"
import { useActions, useAppStore, useChords, useSettings } from "../store/progressionStore"
import { getChordDisplay } from "../codec"
import { ChordPianoComponent } from "../components/ChordPianoComponent"
import { ChordInput } from "./ChordInput"
import { GuitarChord } from "./GuitarChord"
import { ChordChartCard } from "./ChordChartCard"
import useNavHeight from "../utils/hooks/useNavHeight"
import { isGuitar } from '../utils/settings'
import InlineConfig from './InlineConfig'
import MusicalAnimation from "./MusicalAnimation"
import { cn } from "../lib/utils"
import { prefersReducedMotion } from "../utils/chordTransitions"
import { SortableChordCard, getSortableId } from "./SortableChordCard"
import { SectionBreak, SortableSectionBreak, getSortableBreakId } from "./SectionBreak"
import { ChordPiano } from "../utils/chordPianoHandler"
import { getProgressionItems, isStrayBreak } from "../utils/sectionBreaks"
import { GridLayout, createSectionGridStrategy, measureGridLayout } from "../utils/sectionGridStrategy"

// cards only re-render for their own chord, which they read from the store
const MemoizedChordPiano = memo(({ id, entering }: { id: number, entering: boolean }) => (
  <ChordPianoComponent
    pianoComponentId={Number(id)}
    className={cn(entering && "chord-enter")}
  />
))

const MemoizedGuitarChordSet = memo(({ id, entering }: { id: number, entering: boolean }) => (
  <SortableChordCard
    pianoId={id}
    className={cn("chord-card--guitar", entering && "chord-enter")}
  >
    <ChordInput className="chord-card__controls" pianoComponentId={id} />
    <GuitarChord pianoComponentId={id} />
  </SortableChordCard>
))

// the piano board is a single column, so its cards only move up and down
const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 })

const getPianoId = (item: Active | Over | null): number | undefined => item?.data.current?.pianoId

const getBreakIds = (set: ChordPiano[] | undefined): number[] =>
  getProgressionItems(set).filter((item) => item.type === "break").map((item) => item.id)

/**
 * lays the chords out with a divider after each one that ends a section
 */
function renderWithBreaks(
  set: ChordPiano[],
  renderChord: (chordPiano: ChordPiano) => React.ReactNode,
  renderBreak: (chordPiano: ChordPiano, breakId: number) => React.ReactNode
): React.ReactNode[] {
  return set.flatMap((chordPiano) =>
    chordPiano.breakAfter === undefined
      ? [renderChord(chordPiano)]
      : [renderChord(chordPiano), renderBreak(chordPiano, chordPiano.breakAfter)]
  )
}

const addButtonClass = cn(
  "flex h-11 items-center justify-center gap-1.5 rounded-[0.875rem]",
  "border border-dashed border-border text-sm text-muted-foreground",
  "transition-colors hover:border-primary/50 hover:bg-card/60 hover:text-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "disabled:pointer-events-none disabled:opacity-40"
)

/**
 * quiet dashed row after the last chord that tacks a new chord, or a
 * section break, onto the end. what's added lands where this row was and
 * pushes it down, so the row is kept in view afterwards, which also brings
 * the new card or break with it. a section can only end once, so the
 * break button rests while the progression already ends with one
 */
const AddButtons: React.FC<{ className?: string }> = ({ className }) => {
  const chords = useChords()
  const { addChord, addSectionBreak } = useActions()
  const rowRef = useRef<HTMLDivElement>(null)
  const lastChordPiano = chords[chords.length - 1]
  const canAddBreak = lastChordPiano !== undefined && lastChordPiano.breakAfter === undefined

  // commit now so the new card or break is laid out before scrolling
  const keepInView = () => {
    rowRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "nearest"
    })
  }

  const handleAddChord = () => {
    flushSync(addChord)
    keepInView()
  }

  const handleAddBreak = () => {
    flushSync(addSectionBreak)
    keepInView()
  }

  return (
    <div ref={rowRef} data-flip className={cn("flex gap-2 sm:gap-3", className)}>
      <button type="button" onClick={handleAddChord} className={cn(addButtonClass, "flex-1")}>
        <Plus className="h-4 w-4" />
        Add chord
      </button>
      <button
        type="button"
        onClick={handleAddBreak}
        disabled={!canAddBreak}
        title="End the section here, so the next chord starts a new one"
        className={cn(addButtonClass, "w-[7.5rem] sm:w-36")}
      >
        <span className="section-slash section-slash--icon" aria-hidden="true" />
        Add break
      </button>
    </div>
  )
}

export const PianoBoardComponent: React.FC = () => {
  const chords = useChords()
  const { format, fretView } = useSettings()
  const generation = useAppStore((state) => state.generation)
  const { arrangeProgression } = useActions()
  const navHeight = useNavHeight('nav')
  const boardRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const spacerRef = useRef<HTMLDivElement>(null)
  const hasChords = chords.length > 0

  /**
   * a view is the welcome screen or a board in one format. chords already
   * present when a view mounts arrive with the view's own transition, so
   * only chords added after that get the chord-enter animation.
   *
   * switching format keeps the board (and the format toggle on it) mounted
   * and only swaps the chord list, which then runs the view transition
   * itself. guitar and ukulele share a layout, so switching between them
   * keeps the cards too and only their charts change. the tab view is a
   * layout of its own, so full <-> tab swaps the list as well.
   *
   * loading a new progression from the editor bumps the store's
   * generation, which remounts the board so it enters like a new view
   */
  const boardKey = `${generation}-${hasChords}`
  const layout = !isGuitar(format) ? 'piano' : fretView === 't' ? 'chart' : 'fretted'
  const viewKey = `${boardKey}-${layout}`
  const chordIds = chords.map((chordPiano) => chordPiano.id)
  const breakIds = getBreakIds(chords)
  const [view, setView] = useState({ viewKey, boardKey, ids: chordIds, breakIds, formatSwitched: false })
  if (view.viewKey !== viewKey) {
    setView({ viewKey, boardKey, ids: chordIds, breakIds, formatSwitched: view.boardKey === boardKey })
  }
  const initialIds = view.ids
  const initialBreakIds = view.breakIds

  useEffect(() => {
    document.documentElement.setAttribute('data-format', isGuitar(format) ? 'g' : 'p')
  }, [format])

  /**
   * size the bottom spacer so the page can scroll just far enough for the
   * last chord to reach the top (below the header), and no further
   */
  useLayoutEffect(() => {
    const board = boardRef.current
    const content = contentRef.current
    const spacer = spacerRef.current
    if (!board || !content || !spacer) return

    const updateSpacer = () => {
      const chords = content.querySelectorAll('[id^="piano-"]')
      const lastChord = chords[chords.length - 1]
      if (!lastChord) {
        spacer.style.height = '0px'
        return
      }
      const currentSpacer = spacer.getBoundingClientRect().height
      const lastChordTop = lastChord.getBoundingClientRect().top + window.scrollY
      const scrollHeightWithoutSpacer = document.documentElement.scrollHeight - currentSpacer
      // matches the offset used when navigating to a chord from the header
      const targetScrollTop = lastChordTop - navHeight - 10
      const needed = targetScrollTop + window.innerHeight - scrollHeightWithoutSpacer
      spacer.style.height = `${Math.max(0, Math.ceil(needed))}px`
    }

    updateSpacer()
    const resizeObserver = new ResizeObserver(updateSpacer)
    resizeObserver.observe(content)
    window.addEventListener('resize', updateSpacer)
    // the first measurement is taken mid view-enter, offset by its lift
    board.addEventListener('animationend', updateSpacer)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateSpacer)
      board.removeEventListener('animationend', updateSpacer)
    }
  }, [navHeight, viewKey])

  /**
   * cards are dragged by their handle: with a mouse once it moves a few
   * px (so a stray click doesn't pick one up), with touch right away since
   * the handle doesn't scroll the page, and with the keyboard by focusing
   * the handle, pressing space, moving with the arrow keys and pressing
   * space again (escape puts it back)
   */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // chords and section breaks sort together, each break after its chord
  const items = useMemo(() => getProgressionItems(chords), [chords])
  const sortableIds = useMemo(
    () => items.map((item) => item.type === "chord" ? getSortableId(item.id) : getSortableBreakId(item.id)),
    [items]
  )

  /**
   * the fretted grid gives breaks a row of their own, so it measures its
   * columns and gaps when a drag starts to work out where things land
   */
  const gridRef = useRef<HTMLDivElement>(null)
  const gridLayoutRef = useRef<GridLayout | null>(null)
  const sectionGridStrategy = useMemo(() => createSectionGridStrategy(() => gridLayoutRef.current), [])

  const handleDragStart = () => {
    gridLayoutRef.current = gridRef.current
      ? measureGridLayout(gridRef.current, items.map((item) => item.type === "break"))
      : null
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    gridLayoutRef.current = null
    if (!over || active.id === over.id) return

    const from = sortableIds.indexOf(String(active.id))
    const to = sortableIds.indexOf(String(over.id))
    if (from < 0 || to < 0) return

    // a break dropped where it has nothing to separate goes back
    const arranged = arrayMove(items, from, to)
    if (isStrayBreak(arranged, to)) return

    arrangeProgression(arranged)
  }

  const handleDragCancel = () => {
    gridLayoutRef.current = null
  }

  // nothing is reordered until the drop, so the slot an item is over is
  // where it will land
  const describeItem = (item: Active | Over | null) => {
    if (item?.data.current?.breakId !== undefined) return "Section break"
    const chordPiano = chords.find((p) => p.id === getPianoId(item))
    return chordPiano ? getChordDisplay(chordPiano.selectedChord) : "Chord"
  }
  const describePosition = (item: Active | Over | null) => {
    const index = item ? sortableIds.indexOf(String(item.id)) : -1
    return `position ${index + 1} of ${sortableIds.length}`
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Picked up ${describeItem(active)} at ${describePosition(active)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${describeItem(active)} moved to ${describePosition(over)}.` : "",
    onDragEnd: ({ active, over }) =>
      `${describeItem(active)} dropped at ${describePosition(over ?? active)}.`,
    onDragCancel: ({ active }) =>
      `Reordering cancelled. ${describeItem(active)} returned to ${describePosition(active)}.`
  }

  const renderBreak = useCallback((chordPiano: ChordPiano, breakId: number, className?: string) => (
    <SortableSectionBreak
      key={`break-${breakId}`}
      pianoId={chordPiano.id}
      breakId={breakId}
      entering={!initialBreakIds.includes(breakId)}
      className={className}
    />
  ), [initialBreakIds])

  const renderPianoSet = useMemo(() => renderWithBreaks(
    chords,
    (chordPiano) => (
      <MemoizedChordPiano
        key={`wrapper-${chordPiano.id}`}
        id={chordPiano.id}
        entering={!initialIds.includes(chordPiano.id)}
      />
    ),
    (chordPiano, breakId) => renderBreak(chordPiano, breakId)
  ), [chords, initialIds, renderBreak])

  const renderGuitarSet = useMemo(() => {
    return (
      <div className="guitar-board">
        <div ref={gridRef} className="guitar-grid">
          {renderWithBreaks(
            chords,
            (chordPiano) => (
              <MemoizedGuitarChordSet
                key={chordPiano.id}
                id={chordPiano.id}
                entering={!initialIds.includes(chordPiano.id)}
              />
            ),
            (chordPiano, breakId) => renderBreak(chordPiano, breakId, "col-span-full")
          )}
          <AddButtons className="col-span-full" />
        </div>
      </div>
    )
  }, [chords, initialIds, renderBreak])

  // the tab view is read-only, so its cells aren't sortable
  const renderChartSet = useMemo(() => {
    return (
      <div className="chord-chart">
        {renderWithBreaks(
          chords,
          (chordPiano) => (
            <ChordChartCard
              key={chordPiano.id}
              pianoComponentId={chordPiano.id}
              className={cn(!initialIds.includes(chordPiano.id) && "chord-enter")}
            />
          ),
          (chordPiano, breakId) => (
            <SectionBreak
              key={`break-${breakId}`}
              pianoId={chordPiano.id}
              entering={!initialBreakIds.includes(breakId)}
              className="col-span-full"
            />
          )
        )}
      </div>
    )
  }, [chords, initialIds, initialBreakIds])

  if (!hasChords) {
    return (
      <div
        key="welcome"
        className="pianoBoard view-enter mx-auto flex max-w-md flex-col items-center px-6 text-center"
        style={{ paddingTop: `${navHeight + 80}px` }}
      >
        <MusicalAnimation />
        <h1 className="mt-10 text-lg font-semibold tracking-tight">
          Welcome to Chord Buildr
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Use the controls above to get started.
        </p>
        <InlineConfig className="mt-8" />
      </div>
    )
  }

  return (
    <div
      key={`pianoBoard-${boardKey}`}
      ref={boardRef}
      className={cn(
        "pianoBoard view-enter mx-auto w-full px-2.5 sm:px-4",
        layout === 'fretted' ? "max-w-[84rem]" : "max-w-[62rem]"
      )}
      style={{ paddingTop: `${navHeight + 16}px` }}
    >
      <div ref={contentRef}>
        <div key={layout} className={cn(view.formatSwitched && "view-enter")}>
          {layout === 'chart' ? renderChartSet : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={layout === 'piano' ? [restrictToVerticalAxis] : undefined}
              accessibility={{ announcements }}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext
                items={sortableIds}
                strategy={layout === 'piano' ? verticalListSortingStrategy : sectionGridStrategy}
              >
                {!isGuitar(format) ? (
                  <div className="flex flex-col gap-3 sm:gap-4">
                    {renderPianoSet}
                    <AddButtons />
                  </div>
                ) : renderGuitarSet}
              </SortableContext>
            </DndContext>
          )}
        </div>
        <div data-flip>
          <InlineConfig className="mt-10" />
        </div>
      </div>
      <div ref={spacerRef} aria-hidden="true" />
    </div>
  )
}
