import React, { useContext } from "react"
import "../styles/Piano.css"
import { Key } from "./Key"
import { AppContext, getPianoById } from "../components/context/AppContext"
import { getNoteLetter } from "../utils/noteManager"
import { playPiano } from "../utils/synthPlayer"
import PropTypes from "prop-types"

export const PianoComponent = ({ pianoComponentId }) => {
  const { state, dispatch } = useContext(AppContext)
  const pianoId = pianoComponentId

  const handleClick = (note, noteNumber, octave) => {
    const noteLetter = getNoteLetter("C", noteNumber)
    //console.log(`You've clicked note: ${pianoId} - ${octave} - ${noteLetter}`)

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

  const renderPiano = () => {
    let piano = getPianoById(state, pianoId).piano
    //console.log(piano)
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
            <span>&times;</span>
          </button>
        </div>
      </div>
    </>
  )
}

PianoComponent.propTypes = {
  pianoComponentId: PropTypes.number.isRequired
}
