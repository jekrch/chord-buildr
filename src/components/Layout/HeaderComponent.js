import React, { useContext } from "react"
import Button from "react-bootstrap/Button"
import "../../styles/Layout.css"
import { AppContext, getPianoById } from "../context/AppContext"
import { playPiano } from "../../utils/synthPlayer"

export const HeaderComponent = () => {
  const { state, dispatch } = useContext(AppContext)

  const handleClickAddChord = () => {
    dispatch({
      type: "ADD_CHORD_PIANO",
      payload: "selectedKey"
    })
  }

  const handleItemClick = (id) => {
    console.log("clicked " + id)

    playPiano(state, id)
  }

  const renderProgression = () => {
    return state.chordPianoSet.map((piano, i) => {
      return (
        <li
          className="chordListItem"
          key={piano.id}
          onClick={(id) => handleItemClick(piano.id)}
        >
          <div className="chordItem">
            &nbsp;{piano.selectedChord.noteLetter}
            {piano.selectedChord.type}&nbsp;
            {i !== state.chordPianoSet.length - 1 ? "|" : ""}
          </div>
        </li>
      )
    })
  }
  return (
    <>
      <header className="mainHeader">
        <h1 className="titleText">Chord Buildr</h1>
        <ul className="progression" style={{ listStyle: "none" }}>
          {renderProgression()}
        </ul>
        <Button
          variant="primary"
          size="sm"
          className="btn-main add-chord-btn"
          onClick={() => handleClickAddChord()}
        >
          Add Chord
        </Button>
      </header>
    </>
  )
}
