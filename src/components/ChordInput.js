import { React, useContext, useEffect } from "react"
import Form from "react-bootstrap/Form"
import { noteLetterMapWithSharps, getNoteNumber } from "../utils/noteManager"
import { clearPianoSelections } from "../utils/pianoHelper"
import { chordMap, getNoteLettersChord } from "../utils/chordManager"
import { AppContext } from "../components/context/AppContext"

export const ChordInput = () => {
  const { state, dispatch } = useContext(AppContext)

  var selectedValue = state.selectedKey.noteLetter

  useEffect(() => {
    console.log("UseEffect rendered: " + state.selectedKey.noteLetter)

    //if (!selectedValue || !state.selectedKey) return
    //if (selectedValue == state.selectedKey.noteLetter) return

    console.log("UseEffect rendered: " + state.selectedKey)

    selectedValue = state.selectedKey.noteLetter
    var selectedOctave = state.selectedKey.noteOctave

    if (selectedOctave == null) selectedOctave = 0
    var noteNumber = getNoteNumber(selectedValue)
    selectSingleNote(selectedOctave, noteNumber, state, dispatch)
  }, [state])

  var noteNumber = 1
  var type = ""

  const handleKeySelectChange = (e) => {
    var noteLetter = e.target.value

    if (noteLetter == null) return

    var noteNumber = getNoteNumber(noteLetter)
    console.log(getNoteLettersChord("C", noteNumber, type))

    dispatch({
      type: "UPDATE_KEY",
      payload: { noteLetter: noteLetter, noteOctave: 1 }
    })
    noteNumber = selectSingleNote(1, noteNumber, state, dispatch)
  }

  const handleTypeSelectChange = (e) => {
    type = e.target.value
    console.log(e.target.value)
    console.log(getNoteLettersChord("C", noteNumber, type))

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
          <b> </b>
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

      <br />
    </Form>
  )
}

function selectSingleNote(octave, noteNumber, state, dispatch) {
  var pianoControl = state.piano

  var noteKey = pianoControl[octave][noteNumber - 1]

  if (noteKey.selected) return

  clearPianoSelections(pianoControl)

  noteKey.selected = true
  console.log(noteKey)

  dispatch({ type: "UPDATE_PIANO", payload: pianoControl })

  return noteNumber
}
