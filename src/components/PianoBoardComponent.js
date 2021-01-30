import React, { useContext } from "react"
import "../styles/Piano.css"
import { AppContext } from "../components/context/AppContext"
import { ChordPianoComponent } from "../components/ChordPianoComponent"
import Button from "react-bootstrap/Button"
import PropTypes from "prop-types"

export const PianoBoardComponent = ({ history }) => {
  const { state, dispatch } = useContext(AppContext)

  const handleClickAddChord = () => {
    dispatch({
      type: "ADD_CHORD_PIANO",
      payload: "selectedKey"
    })

    // history.push({
    //   search: "?progression=" + getProgressionCode(state)
    // })
  }
  const renderChordPianoSet = () => {
    return state.chordPianoSet.map((chordPiano) => (
      <ChordPianoComponent
        key={Number(chordPiano.id)}
        class="row"
        pianoComponentId={Number(chordPiano.id)}
        history={history}
      />
    ))
  }

  return (
    <>
      <Button variant="primary" onClick={() => handleClickAddChord()}>
        Add Chord
      </Button>
      {renderChordPianoSet()}
    </>
  )
}

PianoBoardComponent.propTypes = {
  history: PropTypes.object.isRequired
}
