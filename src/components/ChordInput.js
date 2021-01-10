import { React, useContext } from "react"
import Form from "react-bootstrap/Form"
import { noteLetterMapWithSharps, getNoteNumber } from "../utils/noteManager"
import { clearPianoSelections } from "../utils/pianoHelper"
import { chordMap, getNoteLettersChord } from "../utils/chordManager"
import { AppContext } from "../components/context/AppContext"

export const ChordInput = () => {
  const { state, dispatch } = useContext(AppContext)

  var noteKey = 1
  var type = ""

  const handleKeySelectChange = (e) => {
    noteKey = getNoteNumber(e.target.value)
    console.log(e.target.value)
    console.log(getNoteLettersChord("C", noteKey, type))

    var pianoControl = state.piano

    clearPianoSelections(pianoControl)

    //console.log(pianoControl)
    pianoControl[1][noteKey - 1].selected = true
    console.log(pianoControl[1][noteKey - 1])

    dispatch({ type: "UPDATE_PIANO", payload: pianoControl })
  }

  const handleTypeSelectChange = (e) => {
    type = e.target.value
    console.log(e.target.value)
    console.log(getNoteLettersChord("C", noteKey, type))

    return
  }

  var chordTypeArray = Object.keys(chordMap)
  var noteArray = Object.values(noteLetterMapWithSharps)

  return (
    <Form>
      <Form.Group controlId="chordSelection">
        <div class="chordInput">
          <Form.Control
            as="select"
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
        <div class="chordInput">
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
