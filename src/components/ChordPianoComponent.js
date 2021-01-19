import React, { useContext } from "react"
import "../styles/Piano.css"
import { Key } from "./Key"
import { AppContext } from "./context/AppContext"
import { getNoteLetter } from "../utils/noteManager"
import { PianoComponent } from "./PianoComponent"
import { ChordInput } from "./ChordInput"

export const ChordPianoComponent = () => {
  return (
    <>
      <div class="container chordPiano">
        <div class="contentBox row">
          <div class="pianoChordBox">
            <ChordInput class="chordBox" />
            <PianoComponent class="pianoBox" />
          </div>
        </div>
      </div>
    </>
  )
}
