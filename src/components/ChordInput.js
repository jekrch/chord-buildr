import { React, useContext, useEffect, useRef } from "react"
import Form from "react-bootstrap/Form"
import { noteLetterMapWithSharps, getNoteNumber } from "../utils/noteManager"
import { clearPianoSelections } from "../utils/pianoHelper"
import { chordMap, getNoteNumberChord } from "../utils/chordManager"
import { AppContext, getPianoById } from "../components/context/AppContext"
import PropTypes from "prop-types"

export const ChordInput = ({ pianoComponentId }) => {
  const { state, dispatch } = useContext(AppContext)
  const chordRef = useRef({ selectedValue: null, type: null })

  var chordPiano = getPianoById(state, pianoComponentId)

  chordRef.current.selectedValue = chordPiano.selectedKey.noteLetter
  chordRef.current.type = chordPiano.selectedChord.type

  // if no keys are selected, load the selected chord
  if (!hasSelectedNotes(chordPiano.piano)) {
    selectChordKeys(chordPiano, dispatch)
  }

  // triggers whenever the user selects a new key
  useEffect(() => {
    console.log("UseEffect rendered: " + chordPiano.selectedKey.noteLetter)

    chordRef.current.selectedValue = chordPiano.selectedKey.noteLetter
    chordRef.current.type = chordPiano.selectedChord.type

    if (state.building) return

    selectChordKeys(chordPiano, dispatch)
  }, [chordPiano])

  // processes new key selections
  const handleKeySelectChange = (e) => {
    if (e.target.value === null) return

    chordPiano.selectedKey.noteLetter = e.target.value

    dispatch({
      type: "UPDATE_KEY",
      id: chordPiano.id,
      payload: { noteLetter: e.target.value, noteOctave: 0 }
    })

    selectChordKeys(chordPiano, dispatch)
  }

  // processes new chord type selections
  const handleTypeSelectChange = (e) => {
    chordRef.current.type = e.target.value
    console.log(chordRef.current.type)

    selectChordKeysWithType(chordPiano, chordRef.current.type, dispatch)
  }

  var chordTypeArray = Object.keys(chordMap)
  var noteArray = Object.values(noteLetterMapWithSharps)

  return (
    <Form className="chordInputForm">
      <Form.Group controlId="chordSelection">
        <div className="chordInputSelection">
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
        <div className="chordInputSelection">
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
      </Form.Group>
    </Form>
  )
}

function selectChordKeys(chordPiano, dispatch) {
  return selectChordKeysWithType(
    chordPiano,
    chordPiano.selectedChord.type,
    dispatch
  )
}

function selectChordKeysWithType(chordPiano, type, dispatch) {
  var noteLetter = chordPiano.selectedKey.noteLetter

  // if not octave is provided, use the currently selected octave
  var octave = chordPiano.selectedKey.noteOctave

  if (!octave || octave === null) {
    octave = 0
  }

  // don't select the same chord multiple times
  if (chordIsAlreadySelected(chordPiano, type, noteLetter, octave)) return

  var noteNumber = getNoteNumber(noteLetter)
  var chordNoteNumbers = getNoteNumberChord(noteNumber, type)

  clearPianoSelections(chordPiano.piano)

  for (let i = 0; i < chordNoteNumbers.length; i++) {
    var chordNoteNumber = chordNoteNumbers[i]
    console.log(chordNoteNumber)
    selectNote(chordPiano, octave, chordNoteNumber, dispatch)
  }

  updateSelectedChord(chordPiano.id, noteLetter, type, octave, dispatch)
}

function updateSelectedChord(id, noteLetter, type, octave, dispatch) {
  var newSelectedChord = {
    noteLetter: noteLetter,
    type: type,
    octave: octave
  }

  dispatch({ type: "UPDATE_CHORD", id: id, payload: newSelectedChord })
  return newSelectedChord
}

/**
 * Determines whether the currently selected chord matches the provided
 * type, letter, and octave
 */
function chordIsAlreadySelected(chordPiano, type, letter, octave) {
  var selectedChord = chordPiano.selectedChord
  return (
    hasSelectedNotes(chordPiano.piano) &&
    selectedChord !== null &&
    selectedChord.type === type &&
    selectedChord.noteLetter === letter &&
    selectedChord.octave === octave
  )
}

function selectNote(chordPiano, octave, noteNumber, dispatch) {
  ;({ noteNumber, octave } = normalizeNote(noteNumber, octave))

  var piano = chordPiano.piano

  if (noteIsInvalid(piano, octave, noteNumber)) {
    console.log("skipped invalid note: " + octave + " : " + noteNumber)
    return
  }

  var noteKey = piano[octave][noteNumber - 1]

  if (!noteKey || noteKey.selected) {
    console.log("SKIPPED INVALID NOTE: " + octave + " : " + noteNumber)
    return
  }

  noteKey.selected = true

  dispatch({
    type: "UPDATE_PIANO",
    id: chordPiano.id,
    payload: piano
  })
}

ChordInput.propTypes = {
  pianoComponentId: PropTypes.number.isRequired
}

/***
 * if the note is over 12, find the corresponding note in the next octave
   or if we're at the highest octave, bring the note down 12
 */
function normalizeNote(noteNumber, octave) {
  while (noteNumber > 12) {
    noteNumber = noteNumber - 12

    if (!(octave >= 2)) {
      octave++
    }
  }
  return { noteNumber, octave }
}

function noteIsInvalid(pianoControl, octave, noteNumber) {
  if (!pianoControl || !pianoControl[octave]) return true
}

function hasSelectedNotes(pianoControl) {
  for (let i = 0; i < pianoControl.length; i++) {
    var pianoOctave = pianoControl[i]

    for (let j = 0; j < pianoOctave.length; j++) {
      if (pianoOctave[j].selected) return true
    }
  }

  return false
}
