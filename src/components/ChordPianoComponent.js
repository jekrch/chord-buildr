import React from "react"
import "../styles/Piano.css"
import { PianoComponent } from "./PianoComponent"
import { ChordInput } from "./ChordInput"
import PropTypes from "prop-types"

export const ChordPianoComponent = ({ pianoComponentId, history }) => {
  return (
    <>
      <div className="container chordPiano">
        <div className="contentBox row">
          <div className="pianoChordBox">
            <ChordInput
              className="chordBox"
              pianoComponentId={pianoComponentId}
              history={history}
            />
            <PianoComponent
              key={Number(pianoComponentId)}
              className="pianoBox"
              pianoComponentId={Number(pianoComponentId)}
              history={history}
            />
          </div>
        </div>
      </div>
    </>
  )
}

ChordPianoComponent.propTypes = {
  pianoComponentId: PropTypes.number.isRequired,
  history: PropTypes.object.isRequired
}
