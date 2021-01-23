import { React, useContext, useEffect } from "react"
import Form from "react-bootstrap/Form"
import { noteLetterMapWithSharps, getNoteNumber } from "../utils/noteManager"
import { clearPianoSelections } from "../utils/pianoHelper"
import { chordMap, getNoteNumberChord } from "../utils/chordManager"
import { AppContext, getPianoById } from "../components/context/AppContext"
import PropTypes from "prop-types"

export const ChordInput = ({ pianoComponentId }) => {
  const { state, dispatch } = useContext(AppContext)

  const chordPiano = getPianoById(state, pianoComponentId)
  var selectedValue = chordPiano.selectedKey.noteLetter
  var type = ""

  // triggers whenever the user selects a new key
  useEffect(() => {
    console.log(chordPiano)
    console.log("UseEffect rendered: " + chordPiano.selectedKey.noteLetter)

    selectedValue = chordPiano.selectedKey.noteLetter
    var selectedOctave = chordPiano.selectedKey.noteOctave

    if (selectedOctave == null) selectedOctave = 0

    selectChordKeys(
      chordPiano.id,
      selectedOctave,
      selectedValue,
      chordPiano.selectedChord.type,
      chordPiano,
      dispatch
    )
  }, [chordPiano.selectedKey])

  // processes new key selections
  const handleKeySelectChange = (e) => {
    var noteLetter = e.target.value

    if (noteLetter == null) return

    dispatch({
      type: "UPDATE_KEY",
      id: chordPiano.id,
      payload: { noteLetter: noteLetter, noteOctave: 0 }
    })

    selectChordKeys(
      chordPiano.id,
      0,
      noteLetter,
      chordPiano.selectedChord.type,
      chordPiano,
      dispatch
    )
  }

  // processes new chord type selections
  const handleTypeSelectChange = (e) => {
    type = e.target.value
    console.log(e.target.value)

    var noteLetter = chordPiano.selectedKey.noteLetter

    selectChordKeys(chordPiano.id, null, noteLetter, type, chordPiano, dispatch)

    return
  }

  var chordTypeArray = Object.keys(chordMap)
  var noteArray = Object.values(noteLetterMapWithSharps)

  return (
    <Form className="chordInputForm">
      <Form.Group controlId="chordSelection">
        <div className="chordInputSelection">
          <Form.Control
            as="select"
            value={selectedValue}
            defaultValue="C"
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
            defaultValue=""
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

function selectChordKeys(id, octave, noteLetter, type, chordPiano, dispatch) {
  var selectedChord = chordPiano.selectedChord

  // if not ocatave is provided, use the currently selected octave
  if (octave == null) octave = selectedChord.octave

  // don't select the same chord multiple times
  if (chordIsAlreadySelected(selectedChord, type, noteLetter, octave)) return

  var noteNumber = getNoteNumber(noteLetter)
  var chordNoteNumbers = getNoteNumberChord(noteNumber, type)

  clearPianoSelections(chordPiano.piano)

  for (let i = 0; i < chordNoteNumbers.length; i++) {
    var noteNumber = chordNoteNumbers[i]
    console.log(noteNumber)
    noteNumber = selectNote(id, octave, noteNumber, chordPiano, dispatch)
  }

  updateSelectedChord(id, selectedChord, noteLetter, type, octave, dispatch)
}

function updateSelectedChord(
  id,
  selectedChord,
  noteLetter,
  type,
  octave,
  dispatch
) {
  var selectedChord = {
    noteLetter: noteLetter,
    type: type,
    octave: octave
  }

  dispatch({ type: "UPDATE_CHORD", id: id, payload: selectedChord })
  return selectedChord
}

/**
 * Determines whether the currently selected chord matches the provided
 * type, letter, and octave
 * @param {*} selectedChord
 * @param {*} type
 * @param {*} letter
 * @param {*} octave
 */
function chordIsAlreadySelected(selectedChord, type, letter, octave) {
  return (
    selectedChord != null &&
    selectedChord.type == type &&
    selectedChord.noteLetter == letter &&
    selectedChord.octave == octave
  )
}

function selectNote(id, octave, noteNumber, state, dispatch) {
  var pianoControl = state.piano

  // if the note is over 12, find the corresponding note in the next octave
  while (noteNumber > 12) {
    noteNumber = noteNumber - 12

    if (octave != 2) octave++
  }

  var noteKey = pianoControl[octave][noteNumber - 1]

  if (!noteKey || noteKey.selected) {
    console.log("SKIPPED INVALID NOTE: " + noteNumber)
    return
  }

  noteKey.selected = true

  dispatch({ type: "UPDATE_PIANO", id: id, payload: pianoControl })

  return noteNumber
}

ChordInput.propTypes = {
  pianoComponentId: PropTypes.object.isRequired
}
