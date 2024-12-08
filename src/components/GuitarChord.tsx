import React, { useState } from "react"
import Chord from "@techies23/react-chords"
import guitar from "@tombatossals/chords-db/lib/guitar.json"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons"
import { getPianoById, useAppContext } from "./context/AppContext"
import { ChordPiano } from "../utils/chordPianoHandler"
import { findChordPositions } from "../utils/tabFinder"
import { playMidiNotesGuitar } from "../utils/synthPlayer"

interface GuitarChordProps {
  pianoComponentId: number;
}

export const GuitarChord: React.FC<GuitarChordProps> = ({ pianoComponentId }) => {
  const { state, dispatch } = useAppContext()
  const [currentPosition, setCurrentPosition] = useState(0)

  const chordPiano: ChordPiano | null = getPianoById(state, pianoComponentId);

  if (!chordPiano) {
    return;
  }
  const tabPositions = findChordPositions(chordPiano.selectedChord, guitar.chords);

  const instrument = {
    strings: 6,
    fretsOnChord: 4,
    name: "Guitar",
    keys: [],
    tunings: {
      standard: ["E", "A", "D", "G", "B", "E"],
    },
  }

  const handlePlayClick = (): void => {
    playMidiNotesGuitar(
      tabPositions[currentPosition].midi
    )
  }

  const handleClickRemovePiano = (): void => {
    dispatch({
      type: 'REMOVE_PIANO',
      id: pianoComponentId
    })
  }

  return (
    <div className="guitar-chord !min-w-[15em] ml-2">
      <div>
        <button
          type="button"
          className="guitar-tab-close-button"
          aria-label="Close"
          onClick={handleClickRemovePiano}
        >
          <span className="align-middle text-[1.5em] inline-block !-mt-[0.05em]" aria-hidden="true">&times;</span>
        </button>
        <button
          type="button"
          className="piano-play-button"
          data-format={state.format}
          onClick={handlePlayClick}
        />
      </div>
      <div className={`chord-wrapper inline-block ${chordPiano.isPlaying ? '!bg-red-300' : ''}`}>
        {tabPositions?.length ? (
          <>
            <Chord chord={tabPositions[currentPosition]} instrument={instrument} />
            <div className="w-[11em]">
              <button onClick={() => setCurrentPosition(prev => prev === 0 ? tabPositions.length - 1 : prev - 1)} className="guitar-pos-button">
                <FontAwesomeIcon icon={faChevronLeft} className="guitar-pos-chev" />
              </button>
              <span className="guitar-pos-indicator">
                {currentPosition + 1}/{tabPositions.length}
              </span>
              <button onClick={() => setCurrentPosition(prev => prev === tabPositions.length - 1 ? 0 : prev + 1)} className="guitar-pos-button">
                <FontAwesomeIcon icon={faChevronRight} className="guitar-pos-chev" />
              </button>
            </div>
          </>
        ) : <div>Chord type not supported</div>}
      </div>
    </div>
  )
}