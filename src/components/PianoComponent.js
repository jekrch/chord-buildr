import React, { useContext } from "react"
import "../styles/Piano.css"
import { Key } from "./Key"
import { AppContext } from "../components/context/AppContext"
import { getNoteLetter } from "../utils/noteManager"

export const PianoComponent = () => {
  const { state, dispatch } = useContext(AppContext)
  const handleClick = (note, noteNumber) => {
    console.log(`You've clicked note: ${note}`)
    const noteLetter = getNoteLetter("C", noteNumber)
    dispatch({ type: "UPDATE_KEY", payload: noteLetter })
  }

  const renderPiano = () => {
    let piano = state.piano
    console.log(piano)
    return piano.map((octave, i) => {
      return octave.map((pianoKey) => {
        return (
          <Key
            key={`${pianoKey.note}-${i}`}
            pianoKey={pianoKey}
            handleClick={handleClick}
          />
        )
      })
    })
  }

  return (
    <>
      <ul className="set">{renderPiano()}</ul>
    </>
  )
}
