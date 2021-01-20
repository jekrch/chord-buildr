import React, { useContext } from "react"
import "../styles/Piano.css"
import { Key } from "./Key"
import { AppContext } from "./context/AppContext"
import { getNoteLetter } from "../utils/noteManager"
import { PianoComponent } from "./PianoComponent"
import { ChordInput } from "./ChordInput"
import PropTypes from "prop-types"

export const ChordPianoComponent = ({ index }) => {
  console.log("THIS IS COMPONENT " + index)
  return (
    <>
      <div class="container chordPiano">
        <div class="contentBox row">
          <div class="pianoChordBox">
            <ChordInput class="chordBox" index={index} />
            <PianoComponent class="pianoBox" index={index} />
          </div>
        </div>
      </div>
    </>
  )
}

ChordPianoComponent.propTypes = {
  index: PropTypes.object.isRequired
}
