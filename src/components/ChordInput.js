import { React, useContext, useRef, useEffect } from "react"
import Form from "react-bootstrap/Form"
import {
  noteLetterMapWithSharps,
  noteLetterMapWithFlats
} from "../utils/noteManager"
import { chordMap } from "../utils/chordManager"
import { selectChordKeys, hasSelectedNotes } from "../utils/chordPianoHandler"
import { AppContext, getPianoById } from "../components/context/AppContext"
import PropTypes from "prop-types"
import { updateFlatOrSharpLetter } from "../utils/chordCodeHandler"

export const ChordInput = ({ pianoComponentId }) => {
  const { state, dispatch } = useContext(AppContext)
  const chordRef = useRef({})

  var chordPiano = getPianoById(state, pianoComponentId)

  chordRef.current.showFlats =
    chordPiano.showFlats ||
    chordPiano.selectedKey.noteLetter.includes("b") ||
    (chordPiano.selectedChord.slashNote != null &&
      chordPiano.selectedChord.slashNote.includes("b"))

  chordRef.current.isProgKey = chordPiano.isProgKey ?? false

  // get the current selected key letter, adjusted by flats or sharps
  chordRef.current.selectedChordKey = updateFlatOrSharpLetter(
    chordRef.current.showFlats,
    chordPiano.selectedKey.noteLetter ?? "C"
  )

  chordRef.current.type = chordPiano.selectedChord.type
  chordRef.current.id = chordPiano.id
  chordRef.current.slashChord = chordPiano.selectedChord.slash ?? false

  //chordRef.current.slashNote = chordPiano.selectedChord.slashNote ?? ""
  chordRef.current.slashNote = updateFlatOrSharpLetter(
    chordRef.current.showFlats,
    chordPiano.selectedChord.slashNote ?? ""
  )

  chordRef.current.noteArray = getNoteArray(chordRef.current.showFlats)

  useEffect(() => {
    // if no keys are selected, load the selected chord
    if (!hasSelectedNotes(chordPiano.piano)) {
      selectChordKeys(chordPiano)
    }

    if (!state.building) {
      selectChordKeys(chordPiano)
    }
  })

  // processes new key selections
  const handleKeySelectChange = (e) => {
    if (e.target.value === null) return

    chordRef.current.noteArray = getNoteArray(chordRef.current.showFlats)

    chordPiano.selectedKey.noteLetter = e.target.value

    dispatch({
      type: "UPDATE_KEY",
      id: chordPiano.id,
      payload: {
        noteLetter: e.target.value,
        octave: chordPiano.selectedKey.octave ?? 0
      }
    })
  }

  // processes new chord type selections
  const handleTypeSelectChange = (e) => {
    chordRef.current.type = e.target.value

    //console.log(chordRef.current.type)

    dispatch({
      type: "UPDATE_CHORD_TYPE",
      id: chordPiano.id,
      chordType: chordRef.current.type
    })
  }

  // set whether this chord has the progression key
  const handleIsKeyChecked = (e) => {
    dispatch({
      type: "SET_PROG_KEY",
      keyChecked: e.target.checked,
      id: chordPiano.id
    })
  }

  // set whether this chord has the progression key
  const handleIsSlashChordChecked = (e) => {
    chordRef.current.slashChord = e.target.checked
    dispatch({
      type: "UPDATE_SLASH_CHORD",
      isSlashChord: chordRef.current.slashChord,
      id: chordPiano.id
    })
  }

  // set whether the key selector shows sharps or flats
  const handleIsFlatKeyChecked = (e) => {
    chordRef.current.showFlats = e.target.checked

    dispatch({
      type: "UPDATE_SHOW_FLATS",
      showFlats: chordRef.current.showFlats,
      id: chordPiano.id
    })
  }

  // processes new key selections
  const handleSlashChordNoteChange = (e) => {
    if (e.target.value === null) return

    chordRef.current.slashNote = e.target.value

    dispatch({
      type: "UPDATE_SLASH_CHORD",
      isSlashChord: chordRef.current.slashChord,
      slashNote: chordRef.current.slashNote,
      id: chordPiano.id
    })
  }

  var chordTypeArray = Object.keys(chordMap)

  return (
    <Form className="chordInputForm">
      <Form.Group controlId="chordSelection">
        <div className="chordInputSelection keySelection">
          <Form.Control
            as="select"
            value={chordRef.current.selectedChordKey}
            custom
            className="selectorBox"
            onChange={(e) => handleKeySelectChange(e)}
          >
            {chordRef.current.noteArray.map((option, index) => {
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
          onChange={(e) => handleIsKeyChecked(e)}
        />
        <Form.Check
          type="checkbox"
          key={"slash" + chordRef.current.id}
          label="slash"
          checked={chordRef.current.slashChord}
          className="slashCheckBox chordCheckBox"
          onChange={(e) => handleIsSlashChordChecked(e)}
        />
        <Form.Check
          type="checkbox"
          key={"flat" + chordRef.current.id}
          label="b"
          checked={chordRef.current.showFlats}
          className="flatCheckBox chordCheckBox"
          onChange={(e) => handleIsFlatKeyChecked(e)}
        />
        <div className="slashSelection">
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
              className="selectorBox slashSelectorBox"
              as="select"
              value={chordRef.current.slashNote}
              custom
              onChange={(e) => handleSlashChordNoteChange(e)}
            >
              {chordRef.current.noteArray.concat("").map((option, index) => {
                return (
                  <option key={index} value={option}>
                    {option}
                  </option>
                )
              })}
            </Form.Control>
          </div>
        </div>
      </Form.Group>
    </Form>
  )
}

ChordInput.propTypes = {
  pianoComponentId: PropTypes.number.isRequired
}
function getNoteArray(showFlats) {
  if (showFlats) {
    return Object.values(noteLetterMapWithFlats)
  } else {
    return Object.values(noteLetterMapWithSharps)
  }
}
