import React, { useEffect, useState } from "react"
import Navbar from "react-bootstrap/Navbar"
import Button from "react-bootstrap/Button"
import { AppState, useAppContext } from "../context/AppContext"
import { playPiano } from "../../utils/synthPlayer"
import { 
  isSlashChord, 
  getProgressionString, 
  convertProgressionStrToCode 
} from "../../utils/chordCodeHandler"
import { Link, scroller } from "react-scroll"
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { SelectedChord } from "../../utils/chordPianoHandler"

interface ScrollOptions {
  duration: number
  smooth: boolean
  offset: number
  spy: boolean
  hashSpy: boolean
  to: string
}

export const HeaderComponent: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [newChordAdded, setNewChordAdded] = useState(false);
  const [currPlayChordIndex, setCurrPlayChordIndex] = useState(-1);
  
  const offset = -130

  const handleClickPlay = (): void => {
    if (!state.chordPianoSet?.length) {
      return
    }

    const nextPianoId = getNextPlayPianoId()
    navigateToPianoById(nextPianoId)
    handleItemClick(nextPianoId)
  }

  const getNextPlayPianoId = (): number => {
    const nextPianoIndex = getNextPlayChordIndex()
    setCurrPlayChordIndex(nextPianoIndex)
    return state.chordPianoSet?.[nextPianoIndex]!.id ?? 0
  }

  const getNextPlayChordIndex = (): number => {
    let nextPianoIndex = currPlayChordIndex + 1
    
    // if we're exceeding the array length, cycle back to the beginning 
    if (nextPianoIndex >= (state.chordPianoSet?.length ?? 0)) {
      nextPianoIndex = 0
    }
    return nextPianoIndex
  }

  const handleClickAddChord = (): void => {
    dispatch({
      type: "ADD_CHORD_PIANO",
      payload: "selectedKey"
    })
    setNewChordAdded(true)
  }

  useEffect(() => {
    if (!state.chordPianoSet?.length) return

    if (newChordAdded) {
      const lastPianoId = state.chordPianoSet[state.chordPianoSet.length - 1].id ?? 0;
      navigateToPianoById(lastPianoId)
      setNewChordAdded(false)
    }
  }, [state.chordPianoSet, newChordAdded])

  const navigateToPianoById = (pianoId: number): void => {
    const targetKey = `piano-${pianoId}`
    const options: ScrollOptions = {
      duration: 500,
      smooth: true,
      offset,
      spy: true,
      hashSpy: true,
      to: targetKey
    }

    scroller.scrollTo(targetKey, options)
  }

  const handleClickClear = (): void => {
    dispatch({
      type: "BUILD_PROG_FROM_CODE",
      payload: "?s=p:90&p="
    })
  }

  const handleUndoClick = (): void => {
    dispatch({
      type: "LOAD_PREVIOUS_PROG_CODE"
    })
  }

  const handleItemClick = (id: number): void => {
    playPiano(dispatch, state, id)
  }

  const getCurrentSynthVolCode = (state: AppState): string => {
    return state?.currentProgCode?.split('p=')?.[0] ?? "?s=p:90&p="
  }

  const openProgressionEditor = (): void => {
    const synthVolCode = getCurrentSynthVolCode(state)
    const progressionString = getProgressionString(state.chordPianoSet!)
    const submittedProgressionStr = window.prompt("Enter your progression", progressionString)

    if (!submittedProgressionStr) {
      return
    }

    const newProgressionString = convertProgressionStrToCode(submittedProgressionStr)

    if (newProgressionString) {
      dispatch({
        type: "BUILD_PROG_FROM_CODE",
        payload: `${synthVolCode}p=${newProgressionString}`
      })

      dispatch({
        type: "REFRESH_BOARD"
      })
    }
  }

  const getChordDisplay = (chord: SelectedChord): string => {
    return `${chord.noteLetter}${chord.type}${
      isSlashChord(chord) ? `/${chord.slashNote}` : ""
    }`
  }

  const renderProgression = (): JSX.Element[] | undefined => {
    return state.chordPianoSet?.map((piano, i) => (
      <div key={`ci-${piano.id}`}>
        <Link
          className="chordListItem"
          to={`piano-${piano.id}`}
          spy={true}
          offset={offset}
          isDynamic={true}
          duration={500}
          smooth={true}
          onClick={() => handleItemClick(piano.id)}
        >
          <div className="chordItem">
            &nbsp;{getChordDisplay(piano.selectedChord)}
          </div>
        </Link>
        &nbsp;{i !== (state.chordPianoSet?.length ?? 0) - 1 ? "|" : ""}
      </div>
    ))
  }

  return (
    <Navbar fixed="top" className="flex-column mainHeader">
      <div className="headerContainer">
        <div className="buttonContainer row">
          <Button
            variant="primary"
            size="sm"
            className="btn-main chord-btn"
            onClick={handleClickPlay}
            disabled={!state.chordPianoSet?.length}
          >
            Play
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="btn-main chord-btn"
            onClick={handleClickAddChord}
          >
            Add
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="btn-main chord-btn"
            disabled={!state.previousProgCodes?.length}
            onClick={handleUndoClick}
          >
            Undo
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="btn-main chord-btn"
            disabled={!state.chordPianoSet?.length}
            onClick={handleClickClear}
          >
            Clear
          </Button>
        </div>

        <ul className="progression row" style={{ listStyle: "none" }}>
          {renderProgression()}
          <FontAwesomeIcon
            className="progressionEditIcon"
            icon={faPenToSquare as any}
            onClick={openProgressionEditor}
          />
        </ul>
      </div>
    </Navbar>
  )
}