import { React, useContext, useRef, useEffect } from "react"
import Form from "react-bootstrap/Form"
import {
  noteLetterMapWithSharps,
  noteLetterMapWithFlats
} from "../utils/noteManager"
import { chordMap, getScaleAdjustedNoteLetter, equalChroma, noteIsInScale } from "../utils/chordManager"
import { selectChordKeys, hasSelectedNotes } from "../utils/chordPianoHandler"
import { AppContext, getPianoById, getProgKey } from "../components/context/AppContext"
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


  chordRef.current.slashNote = updateFlatOrSharpLetter(
    chordRef.current.showFlats,
    chordPiano.selectedChord.slashNote ?? ""
  )

  chordRef.current.noteArray = getNoteArray(chordRef.current.showFlats, chordPiano.selectedKey.noteLetter, chordPiano.selectedChord.slashNote)

  /**
   * Return a note array for selection in either the chord letter or slash letter 
   * dropdowns. Take into account the current key, but don't coerce the current 
   * selection if no key is currently selected. e.g. if no key is selected and 
   * the user chose B# instead of C, let them use that letter
   * 
   * @param {} showFlats 
   * @param {*} noteLetter 
   * @param {*} slashNote 
   * @returns 
   */
  function getNoteArray(showFlats, noteLetter, slashNote) {
    let notes = Object.values(noteLetterMapWithSharps);

    if (showFlats && !noteLetter?.startsWith('#')) {
      notes = Object.values(noteLetterMapWithFlats)
    } 
  
    let key = getProgKey(state);

    if (key) {
      notes = notes.map(n => getScaleAdjustedNoteLetter(key, n));
    }

    if (
      !key ||
      !noteIsInScale(key, noteLetter) ||
      !noteIsInScale(key, slashNote)
    ) {

      return notes.map(n => {
        if (equalChroma(n, noteLetter)) {
          return noteLetter
        } else if (equalChroma(n, slashNote)) {
          return slashNote;
        } else {
          return n;
        }
      });
    }

    return notes;
  }

  function getKeyRelativeLetter(noteLetter) {
    //console.log(noteLetter)
    let key = getProgKey(state);
    return getScaleAdjustedNoteLetter(key, noteLetter)
  }

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

    chordRef.current.noteArray = getNoteArray(chordRef.current.showFlats, e.target.value)

    let newLetter = getKeyRelativeLetter(e.target.value);

    chordPiano.selectedKey.noteLetter = newLetter

    dispatch({
      type: "UPDATE_KEY",
      id: chordPiano.id,
      payload: {
        noteLetter: newLetter, 
        octave: chordPiano.selectedKey.octave ?? 0
      }
    })
  }

  // processes new chord type selections
  const handleTypeSelectChange = (e) => {
    chordRef.current.type = e.target.value

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

    updateChordLettersGivenKey(chordPiano, state, dispatch)
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

  
  function updateChordLettersGivenKey(keyChordPiano) {

    let key = keyChordPiano.selectedChord

    for (let pianoSetChord of state.chordPianoSet) {

      if (pianoSetChord.id !== keyChordPiano.id) {

        alignChordLetterWithKey(key, pianoSetChord)
      }

      if (pianoSetChord.selectedChord.slash) {
        let slashLetter = pianoSetChord.selectedChord.slashNote;

        alignSlashNoteWithKey(key, slashLetter, pianoSetChord)
      }
    }
  }

  function alignSlashNoteWithKey(key, slashLetter, pianoSetChord) {

    if (noteIsInScale(key, slashLetter)) {
  
      let newLetter = getScaleAdjustedNoteLetter(key, slashLetter)
  
      if (newLetter !== slashLetter) {
        dispatch({
          type: "UPDATE_SLASH_CHORD",
          isSlashChord: true,
          slashNote: newLetter,
          id: pianoSetChord.id
        })
      }
    }
  }

  function alignChordLetterWithKey(key, pianoSetChord) {

    let chordLetter = pianoSetChord.selectedKey.noteLetter
  
    if (noteIsInScale(key, chordLetter)) {
      let newLetter = getScaleAdjustedNoteLetter(key, chordLetter)
  
      if (newLetter !== chordLetter) {
  
        dispatch({
          type: "UPDATE_KEY",
          id: pianoSetChord.id,
          payload: {
            noteLetter: newLetter,
            octave: pianoSetChord.selectedKey.octave ?? 0
          }
        })
      }
    }
  }

  return (
    <Form className="chordInputForm">
      <Form.Group controlId="chordSelection">
        <div className="chordInputSelection keySelection">
          <Form.Control
            as="select"
            value={getKeyRelativeLetter(chordRef.current.selectedChordKey)}
            custom
            className="selectorBox"
            onChange={(e) => handleKeySelectChange(e)}
          >
            {chordRef.current.noteArray.map((option, index) => {
              option = getKeyRelativeLetter(option);
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
              value={getKeyRelativeLetter(chordRef.current.slashNote)}
              custom
              onChange={(e) => handleSlashChordNoteChange(e)}
            > 
              {chordRef.current.noteArray.concat("").map((option, index) => {
                option = getKeyRelativeLetter(option);
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


