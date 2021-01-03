import { React, useState } from "react"
import Form from "react-bootstrap/Form"
import { noteLetterMapWithSharps, getNoteNumber } from "../utils/noteManager"
import { chordMap, getNoteLettersChord } from "../utils/chordManager"

export const ChordInput = () => {
  var noteKey = 1
  var type = ""

  const handleKeySelectChange = (e) => {
    noteKey = getNoteNumber(e.target.value)
    console.log(e.target.value)
    console.log(getNoteLettersChord("C", noteKey, type))

    return
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
