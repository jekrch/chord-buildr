import React from "react"
import Chord from "@techies23/react-chords"
import { getPianoById, useAppContext } from "./context/AppContext"
import { ChordPiano } from "../utils/chordPianoHandler"
import { getChordChart } from "../utils/guitarUtil"
import { Play, X } from "lucide-react"
import { playChord } from "../utils/synthPlayer"
import { removeChordWithTransition } from "../utils/chordTransitions"
import useFormatCrossfade from "../utils/hooks/useFormatCrossfade"
import { cn } from "../lib/utils"
import { DragHandle } from "./SortableChordCard"

interface GuitarChordProps {
  pianoComponentId: number;
}

export const GuitarChord: React.FC<GuitarChordProps> = ({ pianoComponentId }) => {
  const { state, dispatch } = useAppContext()
  const chordPiano: ChordPiano | null = getPianoById(state, pianoComponentId);
  const { leavingFormat, handleEnterEnd } = useFormatCrossfade(state.format)

  // useEffect(() => {
  //   console.log(chordPiano?.isPlaying)
  // }, [chordPiano?.isPlaying, state.chordPianoSet])

  if (!chordPiano) {
    return;
  }

  const { instrument, tabPositions, position } = getChordChart(chordPiano, state.format)
  const leaving = leavingFormat ? getChordChart(chordPiano, leavingFormat) : null
  const entering = Boolean(leavingFormat)
  // the position tabs stay mounted across the switch; only tabs the old
  // instrument didn't have (or the whole group, if it had none) fade in
  const leavingTabCount = leaving ? leaving.tabPositions.length : tabPositions.length

  const handleNewPosition = (position: number): void => {
    chordPiano.selectedChord.position = position;
    //let newChordPiano = {...chordPiano, selectedChord: false} as ChordPiano;

    dispatch({
      type: "UPDATE_PIANO",
      id: chordPiano.id,
      payload: chordPiano
    })
  }

  const handlePlayClick = (): void => {
    playChord(
      dispatch,
      state,
      chordPiano,
      tabPositions
    );
  }

  const handleClickRemovePiano = (): void => {
    removeChordWithTransition(pianoComponentId, () => dispatch({
      type: 'REMOVE_PIANO',
      id: pianoComponentId
    }))
  }

  const isPlaying = Boolean(chordPiano.isPlaying)

  return (
    <>
      <div className="chord-card__rail">
        <button
          type="button"
          className="rail-button rail-play"
          data-playing={isPlaying.toString()}
          aria-label="Play chord"
          title="Play chord"
          onClick={handlePlayClick}
        >
          <Play className="h-3.5 w-3.5 fill-current" />
        </button>
      </div>

      <div className="chord-card__diagram">
        {tabPositions?.length ? (
          <button
            type="button"
            className="diagram-frame"
            data-playing={isPlaying.toString()}
            aria-label="Play chord"
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
                key={state.format}
                className={cn("diagram-art", entering && "instrument-enter")}
                onAnimationEnd={handleEnterEnd}
              >
                <Chord
                  chord={tabPositions[position]}
                  instrument={instrument}
                />
              </span>
            </span>
          </button>
        ) : (
          <div
            key={state.format}
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
