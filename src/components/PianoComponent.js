import React from "react"
import "../styles/Piano.css"
import { Key } from "./Key"
import piano from "./data/piano.json"

export const PianoComponent = () => {
  const newPiano = piano.map(pianoKey => {
    return (
      <li
        key={pianoKey.note + "-" + pianoKey.ocatave}
        className={pianoKey.color + " " + pianoKey.note}
      ></li>
    )
  })
  return (
    <>
      <ul className="set">{newPiano}</ul>
    </>
  )
}
