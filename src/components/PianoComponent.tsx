import React, { useEffect, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import '../styles/Piano.css'
// @ts-ignore
import { Key } from './Key'
import { useAppContext, getPianoById, getProgKeyChord } from './context/AppContext'
import { getNoteLetter } from '../utils/noteManager'
import { getChordNumeral } from '../utils/numeralHelper'
import { playPiano } from '../utils/synthPlayer'
import { getProgressionCode } from "../utils/chordCodeHandler"
import { NoteKey } from '../utils/chordPianoHandler'
// @ts-ignores
import { ChordPianoComponent } from "../components/ChordPianoComponent"

interface PianoComponentProps {
  pianoComponentId: number
  forceUpdate?: number
}

export const PianoComponent: React.FC<PianoComponentProps> = ({ 
  pianoComponentId, 
  forceUpdate 
}) => {
  const { state, dispatch } = useAppContext()
  const pianoId = pianoComponentId
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      // force a re-render of the piano keys on mount
      const piano = getPianoById(state, pianoId)
      if (piano) {
        dispatch({
          type: 'REFRESH_PIANO',
          id: pianoId,
          payload: piano
        })
      }
    }
  }, [pianoId, state, dispatch])

  useEffect(() => {
    if (forceUpdate) {
      const piano = getPianoById(state, pianoId)
      if (piano) {
        dispatch({
          type: 'REFRESH_PIANO',
          id: pianoId,
          payload: piano
        })
      }
    }
  }, [forceUpdate, pianoId, state, dispatch])

  const handleClick = (noteNumber: number, octave: number): void => {
    const noteLetter = getNoteLetter('C', noteNumber)
    const selectedKey = {
      noteLetter,
      octave
    }
    dispatch({
      type: 'UPDATE_KEY',
      id: pianoId,
      payload: selectedKey
    })
  }

  const handleClickRemovePiano = (): void => {
    dispatch({
      type: 'REMOVE_PIANO',
      id: pianoId
    })
  }

  const handlePlayClick = (): void => {
    playPiano(dispatch, state, pianoId)
  }

  const renderPiano = () => {
    const piano = getPianoById(state, pianoId)?.piano || []
    return piano.map((octave, i) => 
      octave.map((pianoKey: NoteKey) => ({
        ...pianoKey,
        octave: i,
        key: `${pianoKey.note}-${i}-${forceUpdate}`,
        handleClick: () => handleClick(pianoKey.noteNumber, i)
      }))
    ).flat().map(pianoKey => (
      <Key
        key={pianoKey.key}
        pianoKey={pianoKey}
        handleClick={pianoKey.handleClick}
      />
    ))
  }

  return (
    <>
      <div className="absolute flex top-0 right-0 left-[6.5em] h-[11.5em]">
        <button
          type="button"
          className="piano-play-button"
          onClick={handlePlayClick}
        />
        <div className="pianoBox">
          <button
            type="button"
            className="relative mr-[-0.5em] top-[-0.6em] ml-[0.1em] !float-left !border-0 !border-none !outline-none"
            aria-label="Close"
            onClick={handleClickRemovePiano}
          >
            <span className="text-gray-400 hover:text-red-300/80 font-medium text-[1.6em] tracking-tighter" aria-hidden="true">&times;</span>
          </button>
          <ul className="set mt-3">{renderPiano()}</ul>
        </div>
        <div className="closeContainer">
          <button
            type="button"
            className="close pianoCloseButtonMobile"
            aria-label="Close"
            onClick={handleClickRemovePiano}
          >
            <span className="mobileClosedBtnText">&times;</span>
          </button>
        </div>
      </div>
    </>
  )
}

export const PianoBoardComponent: React.FC = () => {
  const { state, dispatch } = useAppContext()
  const history = useHistory()
  const [refresh, setRefresh] = React.useState(0)
  const initialLoadRef = useRef(false)

  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true
      const newParams = history.location.search + history.location.hash
      if (newParams) {
        dispatch({
          type: 'BUILD_PROG_FROM_CODE',
          payload: newParams
        })
        setRefresh(prev => prev + 1)
      }
    }
  }, [dispatch, history.location])

  useEffect(() => {
    const currentCode = getProgressionCode(state)
    const newParams = history.location.search + history.location.hash

    if (!state.building && currentCode !== newParams) {
      dispatch({
        type: 'BUILD_PROG_FROM_CODE',
        payload: newParams
      })
      setRefresh(prev => prev + 1)
    }
  }, [history.location.search, history.location.hash, state.building, dispatch])

  const renderChordPianoSet = () => {
    return state.chordPianoSet?.map((chordPiano) => (
      <div key={`wrapper-${chordPiano.id}-${refresh}`}>
        <ChordPianoComponent
          pianoComponentId={Number(chordPiano.id)}
        />
        <div className="pianoStrip" />
      </div>
    ))
  }

  return (
    <div className="pianoBoard">
      {state.chordPianoSet?.length ? (
        <>
          {renderChordPianoSet()}
          <div className="pianoBoardGutter" />
        </>
      ) : (
        <div className="introBody">
          <div className="introText">
            welcome to chord buildr<br/>
            use the controls above to get started
          </div>
        </div>
      )}
    </div>
  )
}