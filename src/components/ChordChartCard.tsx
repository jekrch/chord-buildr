import React from "react"
import Chord from "@techies23/react-chords"
import { useChord, useFormat } from "../store/progressionStore"
import { useIsChordLooping, useIsChordPlaying } from "../store/playbackStore"
import { getChordDisplay } from "../codec"
import { playOrStopChordById } from "../audio/player"
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
  const chordPiano = useChord(pianoComponentId)
  const format = useFormat()
  const isPlaying = useIsChordPlaying(pianoComponentId)
  const isLooping = useIsChordLooping(pianoComponentId)
  const { chartFormat, instrument, leavingFormat, leavingInstrument, handleEnterEnd } = useFormatCrossfade(format)

  if (!chordPiano) return null

  // null while the instrument's chord shapes load
  const chart = instrument ? getChordChart(chordPiano, chartFormat, instrument) : null
  const leaving = leavingFormat && leavingInstrument
    ? getChordChart(chordPiano, leavingFormat, leavingInstrument)
    : null
  const entering = Boolean(leavingFormat)
  // named after what the tab shows, which leaves out a slash note no
  // voicing has under it
  const name = getChordDisplay(chart?.chartChord ?? chordPiano.selectedChord)

  // stops the chord while it loops
  const handlePlayClick = (): void => {
    // the chart can still be the old instrument's while the new one loads
    playOrStopChordById(chordPiano.id, chart && chartFormat === format ? chart.tabPositions : undefined)
  }
  const playLabel = `${isLooping ? "Stop" : "Play"} ${name}`

  return (
    <button
      type="button"
      id={`piano-${pianoComponentId}`}
      className={cn("diagram-frame chart-card", className)}
      data-playing={isPlaying.toString()}
      aria-label={playLabel}
      title={playLabel}
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
        {!chart ? (
          // holds the card's place while the chord shapes load
          <span key={chartFormat} className="chart-card__unsupported" aria-busy="true" />
        ) : chart.tabPositions.length ? (
          <span
            key={chartFormat}
            className={cn("diagram-art", entering && "instrument-enter")}
            onAnimationEnd={handleEnterEnd}
          >
            <Chord
              chord={chart.tabPositions[chart.position]}
              instrument={chart.instrument}
            />
          </span>
        ) : (
          <span
            key={chartFormat}
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
