import React from "react"
import "../styles/Piano.css"
import { Key } from "./Key"
import { pianoGenerator } from "../utils/pianoHelper"

export const PianoComponent = () => {
  const renderPiano = () => {
    let piano = pianoGenerator()
    return piano.map((octave, i) => {
      return octave.map(pianoKey => {
        return <Key key={`${pianoKey.note}-${i}`} pianoKey={pianoKey} />
      })
    })
  }

  return (
    <>
      <ul className="set">{renderPiano()}</ul>
    </>
  )
}
