import React, { useContext } from "react"
import Nav from "react-bootstrap/Nav"
import Button from "react-bootstrap/Button"
import "../../styles/Layout.css"
import { AppContext } from "../context/AppContext"
import { playPiano } from "../../utils/synthPlayer"
import { isSlashChord } from "../../utils/chordCodeHandler"
import { Link } from "react-scroll"

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

    playPiano(dispatch, state, id)
  }

  const renderProgression = () => {
    return state.chordPianoSet.map((piano, i) => {
      return (
        <Link
          className="chordListItem"
          to={"piano-" + piano.id}
          spy={true}
          offset={-100}
          duration={500}
          smooth={true}
          key={piano.id}
          onClick={(id) => handleItemClick(piano.id)}
        >
          <div className="chordItem">
            &nbsp;{piano.selectedChord.noteLetter}
            {piano.selectedChord.type}
            {isSlashChord(piano.selectedChord)
              ? "/" + piano.selectedChord.slashNote
              : ""}
            &nbsp;{i !== state.chordPianoSet.length - 1 ? "|" : ""}
          </div>
        </Link>
      )
    })
  }
  return (
    <>
      <Nav fixed="top" fill className="flex-column mainHeader">
        <div className="headerContainer container">
          <h1 className="titleText">Chord Buildr</h1>

          <ul className="progression row" style={{ listStyle: "none" }}>
            {renderProgression()}
          </ul>
          <Button
            variant="primary"
            size="sm"
            className="btn-main add-chord-btn row"
            onClick={() => handleClickAddChord()}
          >
            Add Chord
          </Button>
        </div>
      </Nav>
    </>
  )
}
