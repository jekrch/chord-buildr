import React, { useEffect, useRef } from 'react'
import { Play, X } from 'lucide-react'
import '../styles/Piano.css'
import { Key } from './Key'
import { useAppContext, getPianoById } from './context/AppContext'
import { getNoteLetter } from '../utils/noteManager'
import { playChordById } from '../utils/synthPlayer'
import { NoteKey } from '../utils/chordPianoHandler'
import { removeChordWithTransition } from "../utils/chordTransitions"
import { DragHandle } from "./SortableChordCard"

interface PianoComponentProps {
  pianoComponentId: number
}

export const PianoComponent: React.FC<PianoComponentProps> = ({
  pianoComponentId
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
        key: `${pianoKey.note}-${i}`,
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
      <div className="chord-card__side">
        <button
          type="button"
          className="rail-button rail-remove"
          aria-label="Remove chord"
          title="Remove chord"
          onClick={handleClickRemovePiano}
        >
          <X className="h-4 w-4" />
        </button>
        <DragHandle />
      </div>
    </>
  )
}
