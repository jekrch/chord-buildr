import React, { useContext } from "react"
import "../styles/Piano.css"
import { Key } from "./Key"
import { useAppContext, getPianoById, getProgKey } from "./context/AppContext"
import { getNoteLetter } from "../utils/noteManager"
import { getScaleAdjustedNoteLetter } from "../utils/chordManager"
import { getChordNumeral } from "../utils/numeralHelper"
import { playPiano } from "../utils/synthPlayer"
import PropTypes from "prop-types"

export const PianoComponent = ({ pianoComponentId }) => {
  const { state, dispatch } = useAppContext()
  const pianoId = pianoComponentId

  const handleClick = (note, noteNumber, octave) => {

    const noteLetter = getNoteLetter("C", noteNumber)

    var selectedKey = {}
    selectedKey.noteLetter = noteLetter
    selectedKey.octave = octave
    dispatch({
      type: "UPDATE_KEY",
      id: pianoId,
      payload: selectedKey
    })
  }

  const handleClickRemovePiano = () => {
    dispatch({
      type: "REMOVE_PIANO",
      id: pianoId
    })
  }

  const handlePlayClick = () => {
    playPiano(dispatch, state, pianoId)
  }

  const getNumeralChord = (chord) => {
    let piano = getPianoById(state, pianoId)
    let key = getProgKey(state);
    return getChordNumeral(key, piano.selectedChord)
  }

  const renderPiano = () => {
    let piano = getPianoById(state, pianoId).piano
    return piano.map((octave, i) => {
      return octave.map((pianoKey) => {
        pianoKey.octave = i
        return (
          <Key
            key={`${pianoKey.note}-${i}`}
            pianoKey={pianoKey}
            handleClick={() =>
              handleClick(pianoKey.note, pianoKey.noteNumber, pianoKey.octave)
            }
          />
        )
      })
    })
  }

  return (
    <>
      <div className="pianoContainer">
        <button
          type="button"
          className="piano-play-button"
          onClick={() => handlePlayClick()}
        ></button>
        <div className="pianoBox">
          <button
            type="button"
            className="close pianoCloseButton"
            aria-label="Close"
            onClick={() => handleClickRemovePiano()}
          >
            <span aria-hidden="true">&times;</span>
          </button>
          <ul className="set">{renderPiano()}</ul>
        </div>
        <div className="closeContainer">
          <button
            type="button"
            className="close pianoCloseButtonMobile"
            aria-label="Close"
            onClick={() => handleClickRemovePiano()}
          >
            <span className="mobileClosedBtnText">&times;</span>
          </button>
        
        </div>
      </div> 
      <div className="pianoRomanNumeral">{getNumeralChord(pianoId)}
      </div>
    </>
  )
}

PianoComponent.propTypes = {
  pianoComponentId: PropTypes.number.isRequired
}
