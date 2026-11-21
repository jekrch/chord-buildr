import React from "react"
import Chord from "@techies23/react-chords"
import { useActions, useChord, useFormat } from "../store/progressionStore"
import { useIsChordLooping, useIsChordPlaying } from "../store/playbackStore"
import { getChordChart } from "../utils/guitarUtil"
import { Play, Square, X } from "lucide-react"
import { playOrStopChordById } from "../audio/player"
import { removeChordWithTransition } from "../utils/chordTransitions"
import useFormatCrossfade from "../utils/hooks/useFormatCrossfade"
import { cn } from "../lib/utils"
import { DragHandle } from "./SortableChordCard"

interface GuitarChordProps {
  pianoComponentId: number;
}

export const GuitarChord: React.FC<GuitarChordProps> = ({ pianoComponentId }) => {
  const chordPiano = useChord(pianoComponentId)
  const format = useFormat()
  const isPlaying = useIsChordPlaying(pianoComponentId)
  const isLooping = useIsChordLooping(pianoComponentId)
  const { setPosition, removeChord } = useActions()
  const { chartFormat, instrument, leavingFormat, leavingInstrument, handleEnterEnd } = useFormatCrossfade(format)

  if (!chordPiano) {
    return;
  }

  // null while the instrument's chord shapes load
  const chart = instrument ? getChordChart(chordPiano, chartFormat, instrument) : null
  const { tabPositions, position } = chart ?? { tabPositions: [], position: 0 }
  const leaving = leavingFormat && leavingInstrument
    ? getChordChart(chordPiano, leavingFormat, leavingInstrument)
    : null
  const entering = Boolean(leavingFormat)
  // the position tabs stay mounted across the switch; only tabs the old
  // instrument didn't have (or the whole group, if it had none) fade in
  const leavingTabCount = leaving ? leaving.tabPositions.length : tabPositions.length

  const handleNewPosition = (position: number): void => {
    setPosition(chordPiano.id, position)
  }

  // stops the chord while it loops
  const handlePlayClick = (): void => {
    // the chart can still be the old instrument's while the new one loads
    playOrStopChordById(chordPiano.id, chart && chartFormat === format ? tabPositions : undefined)
  }
  const playLabel = isLooping ? "Stop chord" : "Play chord"

  const handleClickRemovePiano = (): void => {
    removeChordWithTransition(pianoComponentId, () => removeChord(pianoComponentId))
  }

  return (
    <>
      <div className="chord-card__rail">
        <button
          type="button"
          className="rail-button rail-play"
          data-playing={isPlaying.toString()}
          aria-label={playLabel}
          title={playLabel}
          onClick={handlePlayClick}
        >
          {isLooping
            ? <Square className="h-3 w-3 fill-current" />
            : <Play className="h-3.5 w-3.5 fill-current" />}
        </button>
      </div>

      <div className="chord-card__diagram">
        {!chart ? (
          // keeps the card's size while the chord shapes load
          <div className="aspect-[8/7] w-full" aria-busy="true" />
        ) : tabPositions.length ? (
          <button
            type="button"
            className="diagram-frame"
            data-playing={isPlaying.toString()}
            aria-label={playLabel}
            onClick={handlePlayClick}
          >
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
              <span
                key={chartFormat}
                className={cn("diagram-art", entering && "instrument-enter")}
                onAnimationEnd={handleEnterEnd}
              >
                <Chord
                  chord={tabPositions[position]}
                  instrument={chart.instrument}
                />
              </span>
            </span>
          </button>
        ) : (
          <div
            key={chartFormat}
            onAnimationEnd={handleEnterEnd}
            className={cn(
              "grid aspect-[8/7] w-full place-items-center rounded-[0.625rem] border border-dashed border-border px-4 text-center text-sm text-muted-foreground",
              entering && "instrument-enter"
            )}
          >
            Chord type not supported
          </div>
        )}
      </div>

      <div className="chord-card__side">
        <button
          type="button"
          className="rail-button rail-remove"
          aria-label="Remove chord"
          title="Remove chord"
          onClick={handleClickRemovePiano}
        >
          <X className="h-4 w-4" />
        </button>

        <DragHandle />
      </div>

      {tabPositions?.length > 1 && (
        <div
          className={cn("chord-card__voicing", entering && leavingTabCount <= 1 && "instrument-enter")}
        >
          <div
            className="position-tabs"
            role="group"
            aria-label="Voicing"
            style={{
              "--position": position,
              "--count": tabPositions.length
            } as React.CSSProperties}
          >
            <span className="position-tabs__indicator" aria-hidden="true" />
            {tabPositions.map((_: unknown, i: number) => (
              <button
                key={i}
                type="button"
                className={cn(
                  "position-tab",
                  entering && leavingTabCount > 1 && i >= leavingTabCount && "instrument-enter"
                )}
                aria-label={`Voicing ${i + 1} of ${tabPositions.length}`}
                aria-pressed={i === position}
                title={`Voicing ${i + 1}`}
                onClick={() => handleNewPosition(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
