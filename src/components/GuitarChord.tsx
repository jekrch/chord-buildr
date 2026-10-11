import React from "react"
import Chord from "@techies23/react-chords"
import { getPianoById, useAppContext } from "./context/AppContext"
import { ChordPiano } from "../utils/chordPianoHandler"
import { findChordPositions, getInstrumentByFormat } from "../utils/guitarUtil"
import { Play, X } from "lucide-react"
import { playChord } from "../utils/synthPlayer"
import { Instrument } from "../utils/guitarUtil"
import { removeChordWithTransition } from "../utils/chordTransitions"

interface GuitarChordProps {
  pianoComponentId: number;
}

export const GuitarChord: React.FC<GuitarChordProps> = ({ pianoComponentId }) => {
  const { state, dispatch } = useAppContext()
  const chordPiano: ChordPiano | null = getPianoById(state, pianoComponentId);

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

  // the stored position can outlive the chord it was picked for (e.g. after
  // changing the root or type), so fall back to the first position
  const storedPosition = chordPiano.selectedChord.position ?? 0
  const position = storedPosition < tabPositions.length ? storedPosition : 0

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

  // names the parts that crossfade when switching guitar <-> ukulele;
  // see the instrument view transition in Layout.css
  const swapName = (part: string) =>
    ({ "--swap-name": `${part}-${pianoComponentId}` }) as React.CSSProperties

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
            <span className="diagram-art" style={swapName("diagram")}>
              <Chord
                chord={tabPositions[position]}
                instrument={instrument}
              />
            </span>
          </button>
        ) : (
          <div
            style={swapName("diagram")}
            className="diagram-placeholder grid aspect-[8/7] w-full place-items-center rounded-[0.625rem] border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
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

        {tabPositions?.length > 1 && (
          <div
            className="position-tabs"
            role="group"
            aria-label="Chord position"
            style={{ "--position": position, ...swapName("positions") } as React.CSSProperties}
          >
            <span className="position-tabs__indicator" aria-hidden="true" />
            {tabPositions.map((_: unknown, i: number) => (
              <button
                key={i}
                type="button"
                className="position-tab"
                aria-label={`Position ${i + 1} of ${tabPositions.length}`}
                aria-pressed={i === position}
                title={`Position ${i + 1}`}
                onClick={() => handleNewPosition(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
