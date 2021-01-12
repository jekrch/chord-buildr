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
    if (state.selectedChord.processingChord) return
    //if (selectedValue == state.selectedKey.noteLetter) return

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

    selectChordKeys(1, noteLetter, type, state, dispatch)

    return
  }

  var chordTypeArray = Object.keys(chordMap)
  var noteArray = Object.values(noteLetterMapWithSharps)

  return (
    <Form>
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

function selectChordKeys(selectedOctave, noteLetter, type, state, dispatch) {
  var selectedChord = state.selectedChord

  if (
    selectedChord.processingChord ||
    (selectedChord.type == type &&
      selectedChord.noteLetter == noteLetter &&
      selectedChord.octave == selectedOctave)
  )
    return

  selectedChord.processingChord = true
  dispatch({ type: "UPDATE_CHORD", payload: selectedChord })

  console.log("HERE: " + type)
  var noteNumber = getNoteNumber(noteLetter)
  var chordNoteNumbers = getNoteNumberChord(noteNumber, type)

  clearPianoSelections(state.piano)

  console.log(chordNoteNumbers)

  for (let i = 0; i < chordNoteNumbers.length; i++) {
    var noteNumber = chordNoteNumbers[i]
    console.log(noteNumber)

    noteNumber = selectNote(selectedOctave, noteNumber, state, dispatch)
  }

  var selectedChord = {
    noteLetter: noteLetter,
    type: type,
    octave: selectedOctave
  }

  dispatch({ type: "UPDATE_CHORD", payload: selectedChord })
}

function selectSingleNote(octave, noteNumber, state, dispatch) {
  var pianoControl = state.piano

  console.log("number to select: " + octave + " - " + noteNumber)

  var noteKey = pianoControl[octave][noteNumber - 1]

  if (!noteKey || noteKey.selected) return

  clearPianoSelections(pianoControl)

  noteKey.selected = true

  dispatch({ type: "UPDATE_PIANO", payload: pianoControl })

  return noteNumber
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
