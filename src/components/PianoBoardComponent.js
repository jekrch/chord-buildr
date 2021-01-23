import React, { useContext } from "react"
import "../styles/Piano.css"
import { AppContext } from "../components/context/AppContext"
import { ChordPianoComponent } from "../components/ChordPianoComponent"
import Button from "react-bootstrap/Button"
import PropTypes from "prop-types"

export const PianoBoardComponent = ({history}) => {
  const { state, dispatch } = useContext(AppContext)

  const handleClick = () => {
    console.log(`You've clicked note: `)

    dispatch({
      type: "ADD_CHORD_PIANO",
      payload: "selectedKey"
    })

    console.log("LOOK HERE")
    console.log(history)
    history.push({
      search: "?chord=chordName"
    })
    
  }
  const renderChordPianoSet = () => {
    let i = 0

    return state.chordPianoSet.map(function (n) {
      return <ChordPianoComponent class="row" index={i++} />
    })
  }

  return (
    <>
      <Button variant="primary" onClick={() => handleClick()}>
        Add Chord
      </Button>
      {renderChordPianoSet()}
      {/* <ChordPianoComponent class="row" /> */}
      {/* <ChordPianoComponent class="row" /> */}
    </>
  )
}

PianoBoardComponent.propTypes = {
  history: PropTypes.object.isRequired
}
