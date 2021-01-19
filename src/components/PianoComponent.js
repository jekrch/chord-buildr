import React, { useContext } from "react"
import "../styles/Piano.css"
import { Key } from "./Key"
import { AppContext } from "../components/context/AppContext"
import { getNoteLetter } from "../utils/noteManager"

export const PianoComponent = () => {
  const { state, dispatch } = useContext(AppContext)
  const handleClick = (note, noteNumber, octave) => {
    const noteLetter = getNoteLetter("C", noteNumber)
    console.log(`You've clicked note: ${octave} - ${noteLetter}`)

    var selectedKey = {}
    selectedKey.noteLetter = noteLetter
    selectedKey.noteOctave = octave
    dispatch({
      type: "UPDATE_KEY",
      index: 0,
      payload: selectedKey
    })
  }

  const renderPiano = () => {
    let piano = state.chordPianoSet[0].piano
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
        <ul className="set">{renderPiano()}</ul>
      </div>
    </>
  )
}
