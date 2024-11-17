import React, { useRef, useState } from 'react'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlayCircle } from '@fortawesome/free-solid-svg-icons'
import { useAppContext } from '../context/AppContext'
import { playPiano } from '../../utils/synthPlayer'
import { synthTypes } from '../../utils/synthLibrary'

interface SettingRef {
  synthType: string
  volume: number
}

interface ConfigModalProps extends React.ComponentProps<typeof Modal> {
  show: boolean
  onHide: () => void
}

export function ConfigModal(props: ConfigModalProps): JSX.Element {
  const { state, dispatch } = useAppContext()
  const settingRef = useRef<SettingRef>({
    synthType: state.synth,
    volume: state.volume
  })
  
  // temporary state for the volume while dragging
  const [localVolume, setLocalVolume] = useState<number>(state.volume)

  const handleSynthSelectChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    settingRef.current.synthType = e.target.value
    dispatch({
      type: 'UPDATE_SYNTH',
      synth: settingRef.current.synthType
    })
  }

  // handle the volume slider being dragged
  const handleVolumeDrag = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setLocalVolume(Number(e.target.value))
  }

  // only update the actual volume when the slider is released
  const handleVolumeChangeComplete = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>): void => {
    const value = Number((e.target as HTMLInputElement).value)
    
    if (settingRef.current.volume === value) {
      return
    }

    state.building = true
    settingRef.current.volume = value
    
    dispatch({
      type: 'UPDATE_SYNTH_VOLUME',
      volume: settingRef.current.volume
    })

    state.building = false
  }

  const onPlayClick = (): void => {
    const pianoSet = state.chordPianoSet
    if (!pianoSet?.length) {
      addChord()
      return
    }
    playPiano(dispatch, state, pianoSet[0].id)
  }

  const addChord = (): void => {
    dispatch({
      type: 'ADD_CHORD_PIANO',
      payload: 'selectedKey'
    })
  }

  return (
    <Modal
      {...props}
      size="lg"
      className="configModal"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      transition={false}
    >
      <Modal.Header className="modalHeader" closeButton>
        <div />
      </Modal.Header>
      <Modal.Body>
        <p>
          <div className="configSettings">
            <br />
            <br />
            <Form.Control
              className="selectorBox synthSelector"
              as="select"
              value={settingRef.current.synthType}
              custom
              onChange={handleSynthSelectChange}
            >
              {Object.entries(synthTypes).map(([key, value]) => (
                <option key={`k-${key}`} value={key}>
                  {value}
                </option>
              ))}
            </Form.Control>
            <br />
            <br />
            <Form>
              <Form.Group controlId="formBasicRange">
                <Form.Control
                  type="range"
                  value={localVolume}
                  onChange={handleVolumeDrag}
                  onMouseUp={handleVolumeChangeComplete}
                  onTouchEnd={handleVolumeChangeComplete}
                />
              </Form.Group>
            </Form>
          </div>

          <div className="configChordPlayBtn">
            <FontAwesomeIcon
              className="chordPlayIcon"
              style={{ 
                marginTop: '-1em',
                marginLeft: '-0.9em'
              }}
              size={"5x"}
              height={30}
              icon={faPlayCircle}
              onClick={onPlayClick}
            />
          </div>
        </p>
      </Modal.Body>
    </Modal>
  )
}