import React, { useMemo } from 'react'
import { Play, Square, X } from 'lucide-react'
import '../styles/Piano.css'
import { Key } from './Key'
import { useActions, useChord } from '../store/progressionStore'
import { useIsChordLooping, useIsChordPlaying, usePlayingKeys } from '../store/playbackStore'
import { getNoteLetter } from '../utils/noteManager'
import { playOrStopChordById } from '../audio/player'
import { getChordKeys } from '../utils/chordPianoHandler'
import { getPianoKeys } from '../utils/pianoHelper'
import { removeChordWithTransition } from "../utils/chordTransitions"
import { DragHandle } from "./SortableChordCard"

interface PianoComponentProps {
  pianoComponentId: number
}

export const PianoComponent: React.FC<PianoComponentProps> = ({
  pianoComponentId
}) => {
  const pianoId = pianoComponentId
  const { setChordRoot, removeChord } = useActions()
  const selectedChord = useChord(pianoId)?.selectedChord
  const isPlaying = useIsChordPlaying(pianoId)
  const isLooping = useIsChordLooping(pianoId)
  const playingKeys = usePlayingKeys(pianoId)

  // the keys the chord has down, worked out from the chord itself
  const piano = useMemo(
    () => getPianoKeys(selectedChord ? getChordKeys(selectedChord) : []),
    [selectedChord]
  )

  const handleClick = (noteNumber: number, octave: number): void => {
    setChordRoot(pianoId, getNoteLetter('C', noteNumber), octave)
  }

  const handleClickRemovePiano = (): void => {
    removeChordWithTransition(pianoId, () => removeChord(pianoId))
  }

  // stops the chord while it loops
  const handlePlayClick = (): void => {
    playOrStopChordById(pianoId)
  }

  const renderPiano = () =>
    piano.flat().map((pianoKey) => {
      const index = pianoKey.octave * 12 + pianoKey.noteNumber - 1
      const played = playingKeys?.notes.includes(index) ?? false

      return (
        <Key
          key={`${pianoKey.note}-${pianoKey.octave}`}
          pianoKey={pianoKey}
          isPlaying={played && playingKeys?.phase === 'playing'}
          isStopping={played && playingKeys?.phase === 'stopping'}
          handleClick={() => handleClick(pianoKey.noteNumber, pianoKey.octave)}
        />
      )
    })

  return (
    <>
      <div className="chord-card__rail">
        <button
          type="button"
          className="rail-button rail-play"
          data-playing={isPlaying.toString()}
          aria-label={isLooping ? "Stop chord" : "Play chord"}
          title={isLooping ? "Stop chord" : "Play chord"}
          onClick={handlePlayClick}
        >
          {isLooping
            ? <Square className="h-3 w-3 fill-current" />
            : <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />}
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
