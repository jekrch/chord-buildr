import React from "react"
import "../styles/Piano.css"
import { Key } from "./Key"
import { pianoGenerator } from "../utils/pianoHelper"

export const PianoComponent = () => {
  const handleClick = note => {
    console.log(`You've clicked note: ${note}`)
  }

  const renderPiano = () => {
    let piano = pianoGenerator()
    return piano.map((octave, i) => {
      return octave.map(pianoKey => {
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
