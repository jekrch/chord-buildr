import React, { useState } from "react"
import Chord from "@techies23/react-chords"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons"
import { getPianoById, useAppContext } from "./context/AppContext"
import { ChordPiano } from "../utils/chordPianoHandler"
import { findChordPositions, getInstrumentByFormat, isGuitar } from "../utils/guitarUtil"
import { MousePointerClick } from "lucide-react"
import { playChord } from "../utils/synthPlayer"
import { Instrument } from "../utils/guitarUtil"

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
    dispatch({
      type: 'REMOVE_PIANO',
      id: pianoComponentId
    })
  }

  return (
    <div 
      id={`piano-${pianoComponentId}`}
      className="guitar-chord !min-w-[15em] ml-1 "
    >
      <div className="!w-[1.9em] !h-[2.3em] !left-[0.2em] pl-1">
        <button
          type="button"
          className="guitar-tab-close-button items-center justify-center !left-0"
          aria-label="Close"
          onClick={handleClickRemovePiano}
        >
          <div className="mt-[0.1em]">
            <span className="text-2xl leading-none" aria-hidden="true">&times;</span>
          </div>
        </button>
        <button
          type="button"
          className="piano-play-button relative !h-[8em] !mt-[0.5em] !top-0 !left-0"
          data-format={isGuitar(state.format) ? "g" : "p"}
          onClick={handlePlayClick}
        />
      </div>
      <div className={`chord-wrapper inline-block`} data-playing={chordPiano.isPlaying?.toString()} >
        {tabPositions?.length ? (
          <>
            <div               
              onClick={handlePlayClick}
              className="cursor-pointer mt-[0.7em] border-slate-400 hover:border-primary/80 border-[0.01em] rounded-[8px] shadow-lg"
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

