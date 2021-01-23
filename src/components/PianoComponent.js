import React, { useContext } from "react"
import "../styles/Piano.css"
import { Key } from "./Key"
import { AppContext, getPianoById } from "../components/context/AppContext"
import { getNoteLetter } from "../utils/noteManager"
import PropTypes from "prop-types"

export const PianoComponent = ({ pianoComponentId }) => {
  const { state, dispatch } = useContext(AppContext)
  const pianoId = pianoComponentId
  const handleClick = (note, noteNumber, octave) => {
    const noteLetter = getNoteLetter("C", noteNumber)
    console.log(`You've clicked note: ${pianoId} - ${octave} - ${noteLetter}`)

    var selectedKey = {}
    selectedKey.noteLetter = noteLetter
    selectedKey.noteOctave = octave
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

  const renderPiano = () => {
    let piano = getPianoById(state, pianoId).piano
    console.log(piano)
    return piano.map((octave, i) => {
      return octave.map((pianoKey) => {
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
      <div className="pianoBox">
        <button
          type="button"
          class="close pianoCloseButton"
          aria-label="Close"
          onClick={() => handleClickRemovePiano()}
        >
          <span aria-hidden="true">&times;</span>
        </button>
        <ul className="set">{renderPiano()}</ul>
      </div>
    </>
  )
}

PianoComponent.propTypes = {
  pianoComponentId: PropTypes.object.isRequired
}
