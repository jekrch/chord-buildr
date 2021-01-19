import { React, useContext, useEffect } from "react"
import Form from "react-bootstrap/Form"
import { noteLetterMapWithSharps, getNoteNumber } from "../utils/noteManager"
import { clearPianoSelections } from "../utils/pianoHelper"
import { chordMap, getNoteNumberChord } from "../utils/chordManager"
import { AppContext } from "../components/context/AppContext"

export const ChordInput = () => {
  const { state, dispatch } = useContext(AppContext)

  var selectedValue = state.chordPianoSet[0].selectedKey.noteLetter
  var type = ""

  // triggers whenever the user selects a new key
  useEffect(() => {
    console.log(
      "UseEffect rendered: " + state.chordPianoSet[0].selectedKey.noteLetter
    )

    selectedValue = state.chordPianoSet[0].selectedKey.noteLetter
    var selectedOctave = state.chordPianoSet[0].selectedKey.noteOctave

    if (selectedOctave == null) selectedOctave = 0

    selectChordKeys(
      selectedOctave,
      selectedValue,
      state.chordPianoSet[0].selectedChord.type,
      state.chordPianoSet[0],
      dispatch
    )
  }, [state.chordPianoSet[0].selectedKey])

  // processes new key selections
  const handleKeySelectChange = (e) => {
    var noteLetter = e.target.value

    if (noteLetter == null) return

    dispatch({
      type: "UPDATE_KEY",
      index: 0,
      payload: { noteLetter: noteLetter, noteOctave: 0 }
    })

    selectChordKeys(
      0,
      noteLetter,
      state.chordPianoSet[0].selectedChord.type,
      state.chordPianoSet[0],
      dispatch
    )
  }

  // processes new chord type selections
  const handleTypeSelectChange = (e) => {
    type = e.target.value
    console.log(e.target.value)

    var noteLetter = state.chordPianoSet[0].selectedKey.noteLetter

    selectChordKeys(null, noteLetter, type, state.chordPianoSet[0], dispatch)

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

function selectChordKeys(octave, noteLetter, type, chordPiano, dispatch) {
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
    noteNumber = selectNote(octave, noteNumber, chordPiano, dispatch)
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

  dispatch({ type: "UPDATE_CHORD", index: 0, payload: selectedChord })
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

  dispatch({ type: "UPDATE_PIANO", index: 0, payload: pianoControl })

  return noteNumber
}
