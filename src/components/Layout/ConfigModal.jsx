import { React, useContext, useRef, useEffect, useState } from "react"
import Form from "react-bootstrap/Form"
import { useAppContext } from "../context/AppContext"
import Modal from "react-bootstrap/Modal"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlayCircle } from "@fortawesome/free-solid-svg-icons"
import { playPiano } from "../../utils/synthPlayer"
import { synthTypes } from "../../utils/synthLibrary"

export function ConfigModal(props) {
  const { state, dispatch } = useAppContext()
  const settingRef = useRef({})
  
  settingRef.current.synthType = state.synth
  settingRef.current.volume = state.volume

  // Temporary state for the volume while dragging
  const [localVolume, setLocalVolume] = useState(state.volume);

  const handleSynthSelectChange = (e) => {
    settingRef.current.synthType = e.target.value
    dispatch({
      type: "UPDATE_SYNTH",
      id: null,
      synth: settingRef.current.synthType
    })
  }

  // Handle the volume slider being dragged
  const handleVolumeDrag = (e) => {
    setLocalVolume(e.target.value);
  }

  // Only update the actual volume when the slider is released
  const handleVolumeChangeComplete = (e) => {
    if (settingRef.current.volume === e.target.value) {
      return;
    }
    state.building = true;
    settingRef.current.volume = e.target.value;
    
    dispatch({
      type: "UPDATE_SYNTH_VOLUME",
      id: null,
      volume: settingRef.current.volume
    })

    state.building = false;
  }

  const onPlayClick = () => {
    var pianoSet = state.chordPianoSet
    if (pianoSet == null || pianoSet.length == 0) {
      addChord()
      return
    }
    playPiano(dispatch, state, pianoSet[0].id)
  }

  const addChord = () => {
    dispatch({
      type: "ADD_CHORD_PIANO",
      payload: "selectedKey"
    })
  }

  return (
    <Modal
      {...props}
      size="lg"
      className="configModal"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header className="modalHeader" closeButton>
        <div />
      </Modal.Header>
      <Modal.Body>
        <p>
          <div class="configSettings">
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
                <option key={"k-" + key} value={key}>
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

          <div class="configChordPlayBtn">
            <FontAwesomeIcon
              class="chordPlayIcon"
              icon={faPlayCircle}
              onClick={onPlayClick}
            />
          </div>
        </p>
      </Modal.Body>
    </Modal>
  )
}