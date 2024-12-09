import React, { useEffect, useState } from "react"
import { Link, scroller } from "react-scroll"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons"
import { AppState, useAppContext } from "../context/AppContext"
import { playChord } from "../../utils/synthPlayer"
import { Button } from '../../components/ui/button';
import { 
  getChordDisplay, 
  getProgressionString, 
  convertProgressionStrToCode 
} from "../../utils/chordCodeHandler"

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
    playChord(dispatch, state, id)
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

  const renderProgression = (): JSX.Element[] | undefined => {
    return state.chordPianoSet?.map((piano, i) => (
      <div
        key={`ci-${piano.id}`} 
        className="flex"
      >
        <Link
          className={`chordListItem cursor-pointer hover:text-blue-600 transition-colors pl-[3px] !ml-[-3px]`}
          to={`piano-${piano.id}`}
          spy={state.format !== "g"}
          offset={offset}
          isDynamic={true}
          duration={500}
          smooth={true}
          onClick={() => handleItemClick(piano.id)}
        >
          <div className="chordItem">
            {getChordDisplay(piano.selectedChord)}
          </div>
        </Link>
        {i !== (state.chordPianoSet?.length ?? 0) - 1 && (
          <span className="mx-2">|</span>
        )}
      </div>
    ))
  }

  return (
    <nav className="fixed top-0 w-full bg-background opacity-[98%] shadow-sm z-50 ">
      <div className="flex flex-col">
        <div className="flex justify-center bg-primary/10">
          <Button
            variant="default"
            size="sm"
            className="btn-main chord-btn"
            onClick={handleClickPlay}
            disabled={!state.chordPianoSet?.length}
          >
            Play
          </Button>

          <Button
            variant="default"
            size="sm"
            className="btn-main chord-btn"
            onClick={handleClickAddChord}
          >
            Add
          </Button>

          <Button
            variant="default"
            size="sm"
            className="btn-main chord-btn"
            disabled={!state.previousProgCodes?.length}
            onClick={handleUndoClick}
          >
            Undo
          </Button>

          <Button
            variant="default"
            size="sm"
            className="btn-main chord-btn"
            disabled={!state.chordPianoSet?.length}
            onClick={handleClickClear}
          >
            Clear
          </Button>
        </div>

        <div className="flex items-center progression border-t border-border border-b py-3 px-4">
          <div className="flex flex-wrap justify-center">
            {renderProgression()}
          </div>
          <FontAwesomeIcon
            className="!ml-[0.8em] mb-[0.4em] cursor-pointer progressionEditIcon"
            icon={faPenToSquare as any}
            onClick={openProgressionEditor}
          />
        </div>
      </div>
    </nav>
  )
}