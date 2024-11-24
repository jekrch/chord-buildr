import React, { useState } from "react"
import Chord from "@techies23/react-chords"
import guitar from "@tombatossals/chords-db/lib/guitar.json"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons"
import { getPianoById, useAppContext } from "./context/AppContext"
import { ChordPiano } from "../utils/chordPianoHandler"
import { findChordPositions } from "../utils/tabFinder"
import { getChordDisplay } from "../utils/chordCodeHandler"
import { playMidiNotes, playPiano } from "../utils/synthPlayer"
import { getSynth } from "../utils/synthLibrary"

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
    const synth = getSynth(state);

    playMidiNotes(synth, 1, tabPositions[currentPosition].midi, 12)
    playPiano(dispatch, state, pianoComponentId)
  }

  return (
    <div className="guitar-chord">
            <button
              type="button"
              className="piano-play-button"
              onClick={handlePlayClick}
            />
      <div className="chord-wrapper">
        {tabPositions?.length ? (
          <>
            <Chord chord={tabPositions[currentPosition]} instrument={instrument} />
            <div className="guitar-pos-navigation">
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
        ) : <div>Chord type not supported</div> }
      </div>
    </div>
  )
}