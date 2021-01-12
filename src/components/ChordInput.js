import { React, useContext, useEffect } from "react"
import Form from "react-bootstrap/Form"
import { noteLetterMapWithSharps, getNoteNumber } from "../utils/noteManager"
import { clearPianoSelections } from "../utils/pianoHelper"
import { chordMap, getNoteNumberChord } from "../utils/chordManager"
import { AppContext } from "../components/context/AppContext"

export const ChordInput = () => {
  const { state, dispatch } = useContext(AppContext)

  var selectedValue = state.selectedKey.noteLetter
  var noteNumber = 1
  var type = ""

  useEffect(() => {
    console.log("UseEffect rendered: " + state.selectedKey.noteLetter)

    selectedValue = state.selectedKey.noteLetter
    var selectedOctave = state.selectedKey.noteOctave

    if (selectedOctave == null) selectedOctave = 0

    selectChordKeys(
      selectedOctave,
      selectedValue,
      state.selectedChord.type,
      state,
      dispatch
    )

    //selectSingleNote(selectedOctave, noteNumber, state, dispatch)
  }, [state.selectedKey.noteLetter])

  const handleKeySelectChange = (e) => {
    var noteLetter = e.target.value

    if (noteLetter == null) return

    dispatch({
      type: "UPDATE_KEY",
      payload: { noteLetter: noteLetter, noteOctave: 1 }
    })

    selectChordKeys(1, noteLetter, type, state, dispatch)
  }

  const handleTypeSelectChange = (e) => {
    type = e.target.value
    console.log(e.target.value)

    var noteLetter = state.selectedKey.noteLetter

    selectChordKeys(null, noteLetter, type, state, dispatch)

    return
  }

  var chordTypeArray = Object.keys(chordMap)
  var noteArray = Object.values(noteLetterMapWithSharps)

  return (
    <Form className="chordInputForm">
      <Form.Group controlId="chordSelection">
        <div className="chordInput">
          <Form.Control
            as="select"
            value={selectedValue}
            defaultValue="C"
            custom
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
        <div className="chordInput">
          <Form.Control
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

function selectChordKeys(octave, noteLetter, type, state, dispatch) {
  var selectedChord = state.selectedChord

  if (octave == null) octave = selectedChord.octave

  if (chordIsAlreadySelected(selectedChord, type, noteLetter, octave)) return

  var noteNumber = getNoteNumber(noteLetter)
  var chordNoteNumbers = getNoteNumberChord(noteNumber, type)

  clearPianoSelections(state.piano)

  for (let i = 0; i < chordNoteNumbers.length; i++) {
    var noteNumber = chordNoteNumbers[i]
    console.log(noteNumber)
    noteNumber = selectNote(octave, noteNumber, state, dispatch)
  }

  updateSelectedChord(selectedChord, noteLetter, type, octave, dispatch)
}

function updateSelectedChord(
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

  dispatch({ type: "UPDATE_CHORD", payload: selectedChord })
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
    selectedChord.type == type &&
    selectedChord.noteLetter == letter &&
    selectedChord.octave == octave
  )
}

function selectNote(octave, noteNumber, state, dispatch) {
  var pianoControl = state.piano

  // if the note is over 12, find the corresponding note in the next octave
  if (noteNumber > 12) {
    noteNumber = noteNumber - 12

    if (octave != 2) octave++
  }

  var noteKey = pianoControl[octave][noteNumber - 1]

  if (!noteKey || noteKey.selected) return

  noteKey.selected = true

  dispatch({ type: "UPDATE_PIANO", payload: pianoControl })

  return noteNumber
}
