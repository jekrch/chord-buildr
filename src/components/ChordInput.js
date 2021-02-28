import { React, useContext, useRef, useEffect } from "react"
import Form from "react-bootstrap/Form"
import { noteLetterMapWithSharps } from "../utils/noteManager"
import { chordMap } from "../utils/chordManager"
import {
  selectChordKeys,
  selectChordKeysWithType,
  hasSelectedNotes
} from "../utils/chordPianoHandler"
import { AppContext, getPianoById } from "../components/context/AppContext"
//import { playPiano } from "../utils/synthPlayer"
import PropTypes from "prop-types"

export const ChordInput = ({ pianoComponentId }) => {
  const { state, dispatch } = useContext(AppContext)
  const chordRef = useRef({})

  //console.log("RENDERED =====> " + pianoComponentId)
  var chordPiano = getPianoById(state, pianoComponentId)

  chordRef.current.isProgKey = chordPiano.isProgKey ?? false
  chordRef.current.selectedValue = chordPiano.selectedKey.noteLetter
  chordRef.current.type = chordPiano.selectedChord.type
  chordRef.current.id = chordPiano.id
  chordRef.current.slashChord = chordPiano.selectedChord.slash ?? false

  useEffect(() => {
    // if no keys are selected, load the selected chord
    if (!hasSelectedNotes(chordPiano.piano)) {
      selectChordKeys(chordPiano, dispatch)
    }

    if (!state.building) {
      selectChordKeys(chordPiano, dispatch)
    }
  })

  // processes new key selections
  const handleKeySelectChange = (e) => {
    if (e.target.value === null) return

    chordPiano.selectedKey.noteLetter = e.target.value

    dispatch({
      type: "UPDATE_KEY",
      id: chordPiano.id,
      payload: { noteLetter: e.target.value, octave: 0 }
    })

    selectChordKeys(chordPiano, dispatch)
  }

  // processes new chord type selections
  const handleTypeSelectChange = (e) => {
    chordRef.current.type = e.target.value

    console.log(chordRef.current.type)

    selectChordKeysWithType(chordPiano, chordRef.current.type, dispatch)
  }

  // set whether this chord has the progression key
  const handleIsKeySelectChange = (e) => {
    console.log(e.target.checked)
    console.log(chordRef.current.type)

    dispatch({
      type: "SET_PROG_KEY",
      keyChecked: e.target.checked,
      id: chordPiano.id
    })
  }

  // set whether this chord has the progression key
  const handleIsSlachChordSelectChange = (e) => {
    console.log(e.target.checked)
    console.log(chordRef.current.type)

    chordRef.current.slashChord = e.target.checked
    dispatch({
      type: "UPDATE_SLASH_CHORD",
      isSlashChord: chordRef.current.slashChord,
      id: chordPiano.id
    })
  }

  var chordTypeArray = Object.keys(chordMap)
  var noteArray = Object.values(noteLetterMapWithSharps)

  return (
    <Form className="chordInputForm">
      <Form.Group controlId="chordSelection">
        <div className="chordInputSelection keySelection">
          <Form.Control
            as="select"
            value={chordRef.current.selectedValue}
            custom
            className="selectorBox"
            onChange={(e) => handleKeySelectChange(e)}
          >
            {noteArray.map((option, index) => {
              return (
                <option key={index} value={option}>
                  {option}
                </option>
              )
            })}
          </Form.Control>
        </div>
        <div className="chordInputSelection typeSelection">
          <Form.Control
            className="selectorBox"
            as="select"
            value={chordRef.current.type}
            custom
            onChange={(e) => handleTypeSelectChange(e)}
          >
            {chordTypeArray.map((option, index) => {
              return (
                <option key={index} value={option}>
                  {option}
                </option>
              )
            })}
          </Form.Control>
        </div>
        <Form.Check
          type="checkbox"
          key={Number(chordRef.current.id)}
          label="key"
          checked={chordRef.current.isProgKey}
          className="keyCheckBox chordCheckBox"
          onChange={(e) => handleIsKeySelectChange(e)}
        />
        <Form.Check
          type="checkbox"
          key={"slash" + chordRef.current.id}
          label="slash"
          checked={chordRef.current.slashChord}
          className="slashCheckBox chordCheckBox"
          onChange={(e) => handleIsSlachChordSelectChange(e)}
        />
        <div
          className="slashSymbol"
          display-option={`${chordRef.current.slashChord}`}
        >
          {"/"}
        </div>
        <div
          className="slashChordSelection"
          display-option={`${chordRef.current.slashChord}`}
        >
          <Form.Control
            className="selectorBox"
            as="select"
            value={chordRef.current.type}
            custom
            // onChange={(e) => handleTypeSelectChange(e)}
          >
            {noteArray.map((option, index) => {
              return (
                <option key={index} value={option}>
                  {option}
                </option>
              )
            })}
          </Form.Control>
        </div>
      </Form.Group>
    </Form>
  )
}

ChordInput.propTypes = {
  pianoComponentId: PropTypes.number.isRequired
}
