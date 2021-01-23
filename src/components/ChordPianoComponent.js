import React, { useContext } from "react"
import "../styles/Piano.css"
import { Key } from "./Key"
import { AppContext } from "./context/AppContext"
import { getNoteLetter } from "../utils/noteManager"
import { PianoComponent } from "./PianoComponent"
import { ChordInput } from "./ChordInput"
import PropTypes from "prop-types"

export const ChordPianoComponent = ({ pianoComponentId }) => {
  return (
    <>
      <div class="container chordPiano">
        <div class="contentBox row">
          <div class="pianoChordBox">
            <ChordInput class="chordBox" pianoComponentId={pianoComponentId} />
            <PianoComponent
              class="pianoBox"
              pianoComponentId={pianoComponentId}
            />
          </div>
        </div>
      </div>
    </>
  )
}

ChordPianoComponent.propTypes = {
  pianoComponentId: PropTypes.object.isRequired
}
