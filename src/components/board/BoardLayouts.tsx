import React, { memo } from "react"
import { ChordPiano } from "../../utils/chordPianoHandler"
import { ChordPianoComponent } from "../ChordPianoComponent"
import { ChordInput } from "../ChordInput"
import { GuitarChord } from "../GuitarChord"
import { ChordChartCard } from "../ChordChartCard"
import { SortableChordCard } from "../SortableChordCard"
import { SectionBreak, SortableSectionBreak } from "../SectionBreak"
import { AddButtons } from "./AddButtons"
import { cn } from "../../lib/utils"

interface BoardLayoutProps {
  chords: ChordPiano[]
  /** the chords and breaks that arrived with the view, see useBoardView */
  initialIds: number[]
  initialBreakIds: number[]
}

/**
 * lays the chords out with a divider after each one that ends a section
 */
function renderWithBreaks(
  chords: ChordPiano[],
  renderChord: (chordPiano: ChordPiano) => React.ReactNode,
  renderBreak: (chordPiano: ChordPiano, breakId: number) => React.ReactNode
): React.ReactNode[] {
  return chords.flatMap((chordPiano) =>
    chordPiano.breakAfter === undefined
      ? [renderChord(chordPiano)]
      : [renderChord(chordPiano), renderBreak(chordPiano, chordPiano.breakAfter)]
  )
}

// cards only re-render for their own chord, which they read from the store
const PianoCard = memo(({ id, entering }: { id: number, entering: boolean }) => (
  <ChordPianoComponent
    pianoComponentId={id}
    className={cn(entering && "chord-enter")}
  />
))

const FrettedCard = memo(({ id, entering }: { id: number, entering: boolean }) => (
  <SortableChordCard
    pianoId={id}
    className={cn("chord-card--guitar", entering && "chord-enter")}
  >
    <ChordInput className="chord-card__controls" pianoComponentId={id} />
    <GuitarChord pianoComponentId={id} />
  </SortableChordCard>
))

/** piano cards in a single sortable column */
export const PianoList = memo(({ chords, initialIds, initialBreakIds }: BoardLayoutProps) => (
  <div className="flex flex-col gap-3 sm:gap-4">
    {renderWithBreaks(
      chords,
      (chordPiano) => (
        <PianoCard
          key={`wrapper-${chordPiano.id}`}
          id={chordPiano.id}
          entering={!initialIds.includes(chordPiano.id)}
        />
      ),
      (chordPiano, breakId) => (
        <SortableSectionBreak
          key={`break-${breakId}`}
          pianoId={chordPiano.id}
          breakId={breakId}
          entering={!initialBreakIds.includes(breakId)}
        />
      )
    )}
    <AddButtons />
  </div>
))

/** guitar or ukulele cards in a sortable grid, each break on a row of its own */
export const FrettedGrid = memo(({
  chords,
  initialIds,
  initialBreakIds,
  gridRef
}: BoardLayoutProps & { gridRef: React.Ref<HTMLDivElement> }) => (
  <div className="guitar-board">
    <div ref={gridRef} className="guitar-grid">
      {renderWithBreaks(
        chords,
        (chordPiano) => (
          <FrettedCard
            key={chordPiano.id}
            id={chordPiano.id}
            entering={!initialIds.includes(chordPiano.id)}
          />
        ),
        (chordPiano, breakId) => (
          <SortableSectionBreak
            key={`break-${breakId}`}
            pianoId={chordPiano.id}
            breakId={breakId}
            entering={!initialBreakIds.includes(breakId)}
            className="col-span-full"
          />
        )
      )}
      <AddButtons className="col-span-full" />
    </div>
  </div>
))

/** the tab view: read-only, so its cells aren't sortable */
export const ChartGrid = memo(({ chords, initialIds, initialBreakIds }: BoardLayoutProps) => (
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
))
