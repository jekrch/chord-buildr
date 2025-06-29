import React, { useEffect, useRef, useState } from "react"
import { Link, scroller } from "react-scroll"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons"
import { AppState, useAppContext } from "../context/AppContext"
import { playChordById } from "../../utils/synthPlayer"
import { Button } from '../../components/ui/button'
import { 
  getChordDisplay, 
  getProgressionString, 
  convertProgressionStrToCode 
} from "../../utils/chordCodeHandler"
import { generateBaseUrlParams } from "../../utils/urlUtil"
import { isGuitar } from "../../utils/guitarUtil"
// NEW: Import the modal component from its own file
import { ProgressionEditorModal } from "./ProgressionEditorModal" 

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
  const [headerOffset, setHeaderOffset] = useState(-130);
  const [currentlyPlayingPianoId, setCurrentlyPlayingPianoId] = useState<number | undefined>(undefined);
  const [isProgressionEditorOpen, setIsProgressionEditorOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  
    /**
   * When a chord is played we want it to be scrolled to. Where we 
   * scroll to should be determined in part by the height of this
   * header so the header doesn't cover the chord when the header 
   * height expands due to large progressions
   */
  useEffect(() => {
    const playingPianoId = state.chordPianoSet?.filter(piano => piano.isPlaying)[0]?.id;
    setCurrentlyPlayingPianoId(playingPianoId);

    const updateOffset = () => {
      if (headerRef.current) {
        const headerHeight = headerRef.current.getBoundingClientRect().height;
        setHeaderOffset(-headerHeight - 10);
      }
    };
    updateOffset();
    const resizeObserver = new ResizeObserver(updateOffset);
    if (headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, [state.chordPianoSet]); // recalculate when chord set changes

  const navigateToPianoById = (pianoId: number): void => {
    const targetKey = `piano-${pianoId}`
    const options: ScrollOptions = {
      duration: 500,
      smooth: true,
      offset: headerOffset,
      spy: true,
      hashSpy: true,
      to: targetKey
    }
    scroller.scrollTo(targetKey, options)
  }

  const handleClickPlay = (): void => {
    if (!state.chordPianoSet?.length) return;
    const nextPianoId = getNextPlayPianoId();
    navigateToPianoById(nextPianoId);
    handleItemClick(nextPianoId);
  }

  const getNextPlayPianoId = (): number => {
    const nextPianoIndex = getNextPlayChordIndex();
    setCurrPlayChordIndex(nextPianoIndex);
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

  const handleClickClear = (): void => {
    dispatch({
      type: "BUILD_PROG_FROM_CODE",
      payload: generateBaseUrlParams(state)
    })
  }

  const handleUndoClick = (): void => {
    dispatch({
      type: "LOAD_PREVIOUS_PROG_CODE"
    })
  }

  const handleItemClick = (id: number): void => {
    playChordById(dispatch, state, id)
  }

  const getCurrentSynthVolCode = (state: AppState): string => {
    return state?.currentProgCode?.split('p=')?.[0] ?? "?s=p:90&p="
  }

  // UPDATED: This function now simply opens the modal.
  const openProgressionEditor = (): void => {
    setIsProgressionEditorOpen(true);
  }

  // This callback handles the logic after the user saves in the modal.
  const handleSaveProgression = (submittedProgressionStr: string): void => {
    if (!submittedProgressionStr) {
      return
    }
    
    const synthVolCode = getCurrentSynthVolCode(state);
    const newProgressionString = convertProgressionStrToCode(submittedProgressionStr);

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
          className={`chordListItem cursor-pointer hover:text-blue-600 transition-colors pl-[3px] !ml-[-3px] ${piano.id === currentlyPlayingPianoId ? "!text-blue-500 underline underline-offset-8" : ''}`}
          to={`piano-${piano.id}`}
          spy={!isGuitar(state.format)}
          offset={headerOffset}
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

  // Return a fragment <> to include the modal as a sibling to the nav.
  return (
    <>
      <nav
        ref={headerRef} 
        className="fixed top-0 w-full bg-background opacity-[98%] shadow-sm z-50 "
      >
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

          <div className="flex items-center justify-center progression border-t border-border border-b py-3 px-4">
            <div className="flex flex-wrap justify-center">
              {renderProgression()}
            </div>
            <FontAwesomeIcon
              className="!ml-[0.8em] mb-[0.4em] cursor-pointer progressionEditIcon "
              icon={faPenToSquare as any}
              onClick={openProgressionEditor}
            />
          </div>
        </div>
      </nav>

      {/* Render the modal and pass the necessary props. */}
      <ProgressionEditorModal
        open={isProgressionEditorOpen}
        onOpenChange={setIsProgressionEditorOpen}
        initialProgression={getProgressionString(state.chordPianoSet ?? [])}
        onSave={handleSaveProgression}
      />
    </>
  )
}