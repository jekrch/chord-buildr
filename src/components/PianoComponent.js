import React, { useContext } from "react"
import "../styles/Piano.css"
import { Key } from "./Key"
import { AppContext } from "../components/context/AppContext"

export const PianoComponent = () => {
  const { state } = useContext(AppContext)
  const handleClick = (note) => {
    console.log(`You've clicked note: ${note}`)
  }

  const renderPiano = () => {
    let piano = state.piano
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
