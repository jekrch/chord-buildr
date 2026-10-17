import React from "react"
import Chord from "@techies23/react-chords"
import { getPianoById, useAppContext } from "./context/AppContext"
import { getChordDisplay } from "../utils/chordCodeHandler"
import { playChord } from "../utils/synthPlayer"
import { cn } from "../lib/utils"
import { getChordChart } from "../utils/guitarUtil"
import useFormatCrossfade from "../utils/hooks/useFormatCrossfade"

interface ChordChartCardProps {
  pianoComponentId: number
  className?: string
}

/**
 * one cell of the tab view: just the chord name over its tab, in the
 * position picked on the full card. the whole cell plays the chord, and
 * editing is left to the full view
 */
export const ChordChartCard: React.FC<ChordChartCardProps> = ({ pianoComponentId, className }) => {
  const { state, dispatch } = useAppContext()
  const chordPiano = getPianoById(state, pianoComponentId)
  const { leavingFormat, handleEnterEnd } = useFormatCrossfade(state.format)

  if (!chordPiano) return null

  const { instrument, tabPositions, position } = getChordChart(chordPiano, state.format)
  const leaving = leavingFormat ? getChordChart(chordPiano, leavingFormat) : null
  const entering = Boolean(leavingFormat)
  const name = getChordDisplay(chordPiano.selectedChord)
  const isPlaying = Boolean(chordPiano.isPlaying)

  const handlePlayClick = (): void => {
    playChord(dispatch, state, chordPiano, tabPositions)
  }

  return (
    <button
      type="button"
      id={`piano-${pianoComponentId}`}
      className={cn("diagram-frame chart-card", className)}
      data-playing={isPlaying.toString()}
      aria-label={`Play ${name}`}
      title={`Play ${name}`}
      onClick={handlePlayClick}
      data-flip
    >
      <span className="chart-card__name">{name}</span>
      <span className="diagram-stack">
        {leaving?.tabPositions.length ? (
          <span
            key={`leaving-${leavingFormat}`}
            className="diagram-art instrument-leave"
            aria-hidden="true"
          >
            <Chord
              chord={leaving.tabPositions[leaving.position]}
              instrument={leaving.instrument}
            />
          </span>
        ) : null}
        {tabPositions.length ? (
          <span
            key={state.format}
            className={cn("diagram-art", entering && "instrument-enter")}
            onAnimationEnd={handleEnterEnd}
          >
            <Chord
              chord={tabPositions[position]}
              instrument={instrument}
            />
          </span>
        ) : (
          <span
            key={state.format}
            className={cn("chart-card__unsupported", entering && "instrument-enter")}
            onAnimationEnd={handleEnterEnd}
          >
            No tab
          </span>
        )}
      </span>
    </button>
  )
}
