import React, { useState } from "react"
import Chord from "@techies23/react-chords"
import guitar from "@tombatossals/chords-db/lib/guitar.json"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons"
import { getPianoById, useAppContext } from "./context/AppContext"
import { ChordPiano } from "../utils/chordPianoHandler"
import { findChordPositions } from "../utils/tabFinder"
import { MousePointerClick } from "lucide-react"
import { playGuitarChord } from "../utils/synthPlayer"

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

  const tabPositions = findChordPositions(
    chordPiano.selectedChord,
    guitar.chords
  );

  const instrument = {
    strings: 6,
    fretsOnChord: 4,
    name: "Guitar",
    keys: [],
    tunings: {
      standard: ["E", "A", "D", "G", "B", "E"],
    },
  }

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
    playGuitarChord(
      dispatch, 
      chordPiano,
      state.synth as any,
      state.volume,
      tabPositions,
    );
  }

  const handleClickRemovePiano = (): void => {
    dispatch({
      type: 'REMOVE_PIANO',
      id: pianoComponentId
    })
  }

  return (
    <div 
      id={`piano-${pianoComponentId}`}
      className="guitar-chord !min-w-[15em] ml-2"
    >
      <div>
        <button
          type="button"
          className="guitar-tab-close-button"
          aria-label="Close"
          onClick={handleClickRemovePiano}
        >
          <span className="align-middle text-[1.5em] inline-block !-mt-[0.16em]" aria-hidden="true">&times;</span>
        </button>
        <button
          type="button"
          className="piano-play-button"
          data-format={state.format}
          onClick={handlePlayClick}
        />
      </div>
      <div className={`chord-wrapper inline-block`} data-playing={chordPiano.isPlaying?.toString()} >
        {tabPositions?.length ? (
          <>
            <div               
              onClick={handlePlayClick}
              className="cursor-pointer mt-[0.7em] border-slate-400 hover:border-primary/80 border-[0.01em] rounded-md shadow-lg"
            >
              <Chord 
                chord={tabPositions[position]} 
                instrument={instrument}
              />
              <MousePointerClick className="max-h-[1.6em] absolute -right-[0.2em] top-[9.5em]" color="red"/>
            </div>
            <div className="w-[11em]">
              <button 
                onClick={
                  () => handleNewPosition(position === 0 ? tabPositions.length - 1 : position - 1)
                } 
                className="guitar-pos-button"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="guitar-pos-chev" />
              </button>
              <span className="guitar-pos-indicator">
                {position + 1}/{tabPositions.length}
              </span>
              <button 
                onClick={
                  () => handleNewPosition(position === tabPositions.length - 1 ? 0 : position + 1)
                } 
                className="guitar-pos-button"
              >
                <FontAwesomeIcon icon={faChevronRight} className="guitar-pos-chev" />
              </button>
            </div>
          </>
        ) : <div className="mt-[4em] -ml-[1em]">
              <div className="max-w-[7em] text-slate-400 text-sm">Chord type not supported</div>
            </div>
      }
      </div>
    </div>
  )
}
