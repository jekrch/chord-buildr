import React, { useContext } from "react"
import "../styles/Piano.css"
import { AppContext } from "../components/context/AppContext"
import { ChordPianoComponent } from "../components/ChordPianoComponent"
import Button from "react-bootstrap/Button"

export const PianoBoardComponent = () => {
  const { state, dispatch } = useContext(AppContext)

  const handleClick = () => {
    console.log(`You've clicked note: `)

    dispatch({
      type: "ADD_CHORD_PIANO",
      payload: "selectedKey"
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
