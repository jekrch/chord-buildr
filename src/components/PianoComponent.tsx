import React, { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { Play, X } from 'lucide-react'
import '../styles/Piano.css'
import { Key } from './Key'
import { useAppContext, getPianoById } from './context/AppContext'
import { getNoteLetter } from '../utils/noteManager'
import { playChordById } from '../utils/synthPlayer'
import { getStateParamsCode } from "../utils/chordCodeHandler"
import { NoteKey } from '../utils/chordPianoHandler'
import { ChordPianoComponent } from "../components/ChordPianoComponent"
import { removeChordWithTransition } from "../utils/chordTransitions"

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
    removeChordWithTransition(pianoId, () => dispatch({
      type: 'REMOVE_PIANO',
      id: pianoId
    }))
  }

  const handlePlayClick = (): void => {
    playChordById(dispatch, state, pianoId)
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

  const isPlaying = Boolean(getPianoById(state, pianoId)?.isPlaying)

  return (
    <>
      <div className="chord-card__rail">
        <button
          type="button"
          className="rail-button rail-play"
          data-playing={isPlaying.toString()}
          aria-label="Play chord"
          title="Play chord"
          onClick={handlePlayClick}
        >
          <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
        </button>
      </div>
      <div className="chord-card__keys keyboard-well">
        <ul className="keyboard">{renderPiano()}</ul>
      </div>
      <button
        type="button"
        className="chord-card__remove rail-button rail-remove"
        aria-label="Remove chord"
        title="Remove chord"
        onClick={handleClickRemovePiano}
      >
        <X className="h-4 w-4" />
      </button>
    </>
  )
}

export const PianoBoardComponent: React.FC = () => {
  const { state, dispatch } = useAppContext()
  const location = useLocation()
  const [refresh, setRefresh] = React.useState(0)
  const initialLoadRef = useRef(false)

  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true
      const newParams = location.search + location.hash
      if (newParams) {
        dispatch({
          type: 'BUILD_PROG_FROM_CODE',
          payload: newParams
        })
        setRefresh(prev => prev + 1)
      }
    }
  }, [dispatch, location])

  useEffect(() => {
    const currentCode = getStateParamsCode(state)
    const newParams = location.search + location.hash

    // console.log(currentCode);
    // console.log(newParams)

    if (!state.building && currentCode !== newParams) {
      dispatch({
        type: 'BUILD_PROG_FROM_CODE',
        payload: newParams
      })
      setRefresh(prev => prev + 1)
    }
  }, [location.search, location.hash, state.building, dispatch])

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
      {state.chordPianoSet?.length && (
        <>
          {renderChordPianoSet()}
          <div className="pianoBoardGutter" />
        </>
      )}
    </div>
  )
}