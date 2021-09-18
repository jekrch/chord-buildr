import React, { useContext, useEffect, useState } from "react"
import Navbar from "react-bootstrap/Navbar"
import Button from "react-bootstrap/Button"
import "../../styles/Layout.css"
import { AppContext } from "../context/AppContext"
import { playPiano } from "../../utils/synthPlayer"
import { isSlashChord } from "../../utils/chordCodeHandler"
import { Link, scroller } from "react-scroll"
import { isMobile } from "react-device-detect"

export const HeaderComponent = () => {
  const { state, dispatch } = useContext(AppContext)

  const [newChordAdded, setNewChordAdded] = useState(false)

  const offset = -130

  const handleClickAddChord = () => {
    dispatch({
      type: "ADD_CHORD_PIANO",
      payload: "selectedKey"
    })
    setNewChordAdded(true)
  }

  useEffect(() => {
    //console.log("render")

    if (!state.chordPianoSet || state.chordPianoSet.length < 1) return

    if (newChordAdded) {
      //(state)
      var targetKey =
        "piano-" + state.chordPianoSet[state.chordPianoSet.length - 1].id

      //console.log(targetKey)
      //console.log(state.chordPianoSet)
      scroller.scrollTo(targetKey, {
        duration: 500,
        smooth: true,
        offset: offset,
        spy: true,
        hashSpy: true,
        to: targetKey
      })

      setNewChordAdded(false)
    }
  }, [state.chordPianoSet])

  const handleClickClear = () => {
    dispatch({
      type: "BUILD_PROG_FROM_CODE",
      payload: ""
    })
  }

  const handleUndoClick = () => {
    dispatch({
      type: "LOAD_PREVIOUS_PROG_CODE",
      payload: ""
    })
  }

  const handleItemClick = (id) => {
    playPiano(dispatch, state, id)
  }

  const renderProgression = () => {
    return state.chordPianoSet.map((piano, i) => {
      return (
        <>
          <Link
            className="chordListItem"
            to={"piano-" + piano.id}
            spy={true}
            offset={offset}
            isDynamic={true}
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
            </div>
          </Link>
          &nbsp;{i !== state.chordPianoSet.length - 1 ? "|" : ""}
        </>
      )
    })
  }
  return (
    <>
      <Navbar fixed="top" className="flex-column mainHeader">
        <div className="headerContainer">
          <div className="buttonContainer row">
            <Button
              variant="primary"
              size="sm"
              className="btn-main chord-btn "
              onClick={() => handleClickAddChord()}
            >
              Add
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="btn-main chord-btn"
              onClick={() => handleUndoClick()}
            >
              Undo
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="btn-main chord-btn"
              onClick={() => handleClickClear()}
            >
              Clear
            </Button>
          </div>
          <ul className="progression row" style={{ listStyle: "none" }}>
            {renderProgression()}
          </ul>
        </div>
      </Navbar>
    </>
  )
}
