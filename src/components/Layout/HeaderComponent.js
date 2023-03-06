import React, { createRef, useContext, useEffect, useState, useRef, useMemo } from "react"
import Navbar from "react-bootstrap/Navbar"
import Button from "react-bootstrap/Button"
import "../../styles/Layout.css"
import { AppContext } from "../context/AppContext"
import { playPiano } from "../../utils/synthPlayer"
import { isSlashChord, getProgressionString } from "../../utils/chordCodeHandler"
import { Link, scroller } from "react-scroll"
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

export const HeaderComponent = () => {

  const { state, dispatch } = useContext(AppContext)
  const [newChordAdded, setNewChordAdded] = useState(false)
  const offset = -130
  const [currPlayChordIndex, setCurrPlayChordIndex] = useState(-1)

  /**
   * When the header play button is clicked, play the next available chord
   * @returns 
   */
  const handleClickPlay = () => {
    if (!state.chordPianoSet?.length) {
      return;
    }

    let nextPianoId = getNextPlayPianoId();

    navigateToPianoById(nextPianoId)
    handleItemClick(nextPianoId)
  }

  /**
   * Returns the piano id of the piano that comes next after the last played piano
   * @returns 
   */
  function getNextPlayPianoId() {
    let nextPianoIndex = getNextPlayChordIndex()
    setCurrPlayChordIndex(nextPianoIndex)
    return state.chordPianoSet[nextPianoIndex]?.id;
  }

  function getNextPlayChordIndex(){
    let nextPianoIndex = currPlayChordIndex + 1
    
    // if we're exceeding the array length, cycle back to the beginning 
    if (nextPianoIndex >= state.chordPianoSet.length) {
      nextPianoIndex = 0
    }
    return nextPianoIndex;
  }

  const handleClickAddChord = () => {
    dispatch({
      type: "ADD_CHORD_PIANO",
      payload: "selectedKey"
    })
    setNewChordAdded(true)
  }

  useEffect(() => {

    if (!state.chordPianoSet || state.chordPianoSet.length < 1) return

    if (newChordAdded) {

      let lastPianoId = state.chordPianoSet[state.chordPianoSet.length - 1].id;
      
      navigateToPianoById(lastPianoId)
      setNewChordAdded(false)
    }
  }, [state.chordPianoSet])

  function navigateToPianoById(pianoId) {
    var targetKey = "piano-" + pianoId

    scroller.scrollTo(targetKey, {
      duration: 500,
      smooth: true,
      offset: offset,
      spy: true,
      hashSpy: true,
      to: targetKey
    })
  }

  const handleClickClear = () => {
    dispatch({
      type: "BUILD_PROG_FROM_CODE",
      payload: "?s=p:90&p="
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

  function openProgressionEditor() {
    
    var progressionString = getProgressionString(state.chordPianoSet);
    var chordProgression = window.prompt("Enter a chord progression", progressionString); 

  }

  function getChordDisplay(chord) {
    return `${chord.noteLetter}${chord.type}${isSlashChord(chord)
      ? "/" + chord.slashNote
      : ""}`;
  }

  const renderProgression = () => {
    return state.chordPianoSet.map((piano, i) => {
      return (
        <div key={"ci-" + piano.id}>
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
              &nbsp;{getChordDisplay(piano.selectedChord)}
            </div>
          </Link>
          &nbsp;{i !== state.chordPianoSet.length - 1 ? "|" : ""}
        </div>
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
              onClick={() => handleClickPlay()}
              disabled={!state.chordPianoSet?.length}
            >
              Play
            </Button>

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
              disabled={!state.chordPianoSet?.length}
              onClick={() => handleClickClear()}
            >
              Clear
            </Button>
          </div>
          <ul className="progression row" style={{ listStyle: "none" }}>
            {renderProgression()}
            <FontAwesomeIcon
              class="progressionEditIcon"
              icon={faPenToSquare}
              onClick={() => {openProgressionEditor()}}
            />
          </ul>
        </div>
      </Navbar>
    </>
  )
}

