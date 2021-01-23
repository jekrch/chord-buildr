import React, { useContext } from "react"
import "../styles/Piano.css"
import { PianoComponent } from "./PianoComponent"
import { ChordInput } from "./ChordInput"
import PropTypes from "prop-types"

export const ChordPianoComponent = ({ pianoComponentId, history }) => {
  return (
    <>
      <div class="container chordPiano">
        <div class="contentBox row">
          <div class="pianoChordBox">
            <ChordInput
              class="chordBox"
              pianoComponentId={pianoComponentId}
              history={history}
            />
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
  pianoComponentId: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired
}
