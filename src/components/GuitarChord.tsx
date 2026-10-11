import React, { useState } from "react"
import Chord from "@techies23/react-chords"
import { getPianoById, useAppContext } from "./context/AppContext"
import { ChordPiano } from "../utils/chordPianoHandler"
import { findChordPositions, getInstrumentByFormat } from "../utils/guitarUtil"
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react"
import { playChord } from "../utils/synthPlayer"
import { Instrument } from "../utils/guitarUtil"
import { removeChordWithTransition } from "../utils/chordTransitions"

interface GuitarChordProps {
  pianoComponentId: number;
}

export const GuitarChord: React.FC<GuitarChordProps> = ({ pianoComponentId }) => {
  const { state, dispatch } = useAppContext()
  const chordPiano: ChordPiano | null = getPianoById(state, pianoComponentId);
  const [position, setPosition] = useState(chordPiano?.selectedChord?.position ?? 0)

  // useEffect(() => {
  //   console.log(chordPiano?.isPlaying)
  // }, [chordPiano?.isPlaying, state.chordPianoSet])

  if (!chordPiano) {
    return;
  }

  const instrument: Instrument = getInstrumentByFormat(state.format);

  const tabPositions = findChordPositions(
    chordPiano.selectedChord,
    instrument.chords,
    state.format
  );


  const handleNewPosition = (position: number): void => {
    setPosition(position);

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

  const pagerButtonClass =
    "grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors " +
    "hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

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

      <div className="chord-card__diagram flex flex-col items-center gap-1.5">
        {tabPositions?.length ? (
          <>
            <button
              type="button"
              className="diagram-frame"
              data-playing={isPlaying.toString()}
              aria-label="Play chord"
              onClick={handlePlayClick}
            >
              <Chord
                chord={tabPositions[position]}
                instrument={instrument}
              />
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous position"
                onClick={
                  () => handleNewPosition(position === 0 ? tabPositions.length - 1 : position - 1)
                }
                className={pagerButtonClass}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[2.75rem] text-center text-xs tabular-nums text-muted-foreground">
                {position + 1} / {tabPositions.length}
              </span>
              <button
                type="button"
                aria-label="Next position"
                onClick={
                  () => handleNewPosition(position === tabPositions.length - 1 ? 0 : position + 1)
                }
                className={pagerButtonClass}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="grid aspect-[8/7] w-full max-w-[12.5rem] place-items-center rounded-[0.625rem] border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
            Chord type not supported
          </div>
        )}
      </div>
      <button
        type="button"
        className="chord-card__remove rail-button rail-remove"
        aria-label="Remove chord"
        title="Remove chord"
        onClick={handleClickRemovePiano}
      >
        <X className="h-4 w-4" />
      </button>
    </>
  )
}
