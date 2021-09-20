import { React, useContext, useRef, useEffect } from "react"
import Form from "react-bootstrap/Form"
import { AppContext } from "../context/AppContext"
import Modal from "react-bootstrap/Modal"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlayCircle } from "@fortawesome/free-solid-svg-icons"
import { playPiano } from "../../utils/synthPlayer"
import { synthTypes } from "../../utils/synthLibrary"

import "../../styles/Layout.css"

export function ConfigModal(props) {
  const { state, dispatch } = useContext(AppContext)

  const settingRef = useRef({})

  settingRef.current.synthType = state.synth
  settingRef.current.volume = state.volume
  //useEffect(() => {})

  // processes new synth selection
  const handleSynthSelectChange = (e) => {
    settingRef.current.synthType = e.target.value

    dispatch({
      type: "UPDATE_SYNTH",
      id: null,
      synth: settingRef.current.synthType
    })
  }

  // processes new synth selection
  const handleVolumeChange = (e) => {
    settingRef.current.volume = e.target.value

    //console.log(settingRef.current.volume)
    dispatch({
      type: "UPDATE_SYNTH_VOLUME",
      id: null,
      volume: settingRef.current.volume
    })
  }

  const onPlayClick = () => {
    var pianoSet = state.chordPianoSet

    // if there's no current piano to play create one
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
      size="l"
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
              onChange={(e) => handleSynthSelectChange(e)}
            >
              {Object.entries(synthTypes).map(([key, value]) => {
                return (
                  <option key={"k-" + key} value={key}>
                    {value}
                  </option>
                )
              })}
            </Form.Control>
            <br />
            <br />{" "}
            <Form>
              <Form.Group controlId="formBasicRange">
                <Form.Control
                  type="range"
                  value={settingRef.current.volume}
                  onChange={(e) => handleVolumeChange(e)}
                />
              </Form.Group>
            </Form>
          </div>

          <div class="configChordPlayBtn">
            <FontAwesomeIcon
              class="chordPlayIcon"
              icon={faPlayCircle}
              onClick={() => onPlayClick()}
            />
          </div>
        </p>
      </Modal.Body>
    </Modal>
  )
}
