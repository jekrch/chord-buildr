import React, { useContext } from "react"
import "../styles/Piano.css"
import {
  AppContext,
  getProgressionCode
} from "../components/context/AppContext"
import { ChordPianoComponent } from "../components/ChordPianoComponent"
import Button from "react-bootstrap/Button"
import PropTypes from "prop-types"

export const PianoBoardComponent = ({ history }) => {
  const { state, dispatch } = useContext(AppContext)

  state.history = history
  var currentCode = getProgressionCode(state)

  var newParams = history.location.search.replace("?prog=", "")
  newParams += history.location.hash

  if (!state.building && currentCode !== newParams) {
    console.log("New chord code provided " + currentCode + " vs " + newParams)

    dispatch({
      type: "BUILD_PROG_FROM_CODE",
      payload: newParams
    })
  }

  const handleClickAddChord = () => {
    dispatch({
      type: "ADD_CHORD_PIANO",
      payload: "selectedKey"
    })
  }
  const renderChordPianoSet = () => {
    return state.chordPianoSet.map((chordPiano) => (
      <ChordPianoComponent
        key={Number(chordPiano.id)}
        className="row"
        pianoComponentId={Number(chordPiano.id)}
        history={history}
      />
    ))
  }

  return (
    <>
      <Button variant="primary" className="btn-main" onClick={() => handleClickAddChord()}>
        Add Chord
      </Button>
      {renderChordPianoSet()}
    </>
  )
}

PianoBoardComponent.propTypes = {
  history: PropTypes.object.isRequired
}
