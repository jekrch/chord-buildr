import { React, useContext, useRef, useEffect } from "react"
import Form from "react-bootstrap/Form"
import {
  noteLetterMapWithSharps,
  noteLetterMapWithFlats,
  getSharpEquivalent,
  getFlatEquivalent
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

  chordRef.current.showFlats = showFlats(chordPiano);
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

  chordRef.current.noteArray = getNoteArray(
    chordRef.current.showFlats, 
    chordPiano.selectedKey.noteLetter, 
    chordPiano.selectedChord.slashNote
  );

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

    updateChordPianoKey(chordPiano, newLetter);
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

    updateChordLettersGivenKey(chordPiano)
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

  /**
   * set whether the note selector shows sharps or flats
   * @param {*} e 
   */
  const handleIsFlatKeyChecked = (e) => {

    let showFlats = e.target.checked
    let currentLetter = chordRef.current.selectedChordKey;
    let currentSlashLetter = chordRef.current.slashNote;
    
    chordRef.current.showFlats = showFlats;

    dispatch({
      type: "UPDATE_SHOW_FLATS",
      showFlats: chordRef.current.showFlats,
      id: chordPiano.id
    });
    
    // if this is the prog key, get the intended letter based on the selection and 
    // directly set the prog key to that letter. e.g. if this is the prog key and its
    // currently set to A# and the user chose to show flats, update this chord piano 
    // to Bb and update the other chord piano letters accordingly  
    if (
        chordRef.current.isProgKey && 
        currentLetter.length >= 2
    ) {

      let newLetter;

      if (currentLetter.endsWith('b') && !showFlats) {
        newLetter = getSharpEquivalent(currentLetter)
      } else if (currentLetter.includes('#') && showFlats) {
        newLetter = getFlatEquivalent(currentLetter);
      }
 
      if (newLetter) {
        // update the chord piano and adjust the other letters accordingly 
        updateChordPianoKey(chordPiano, newLetter)
      }
    }

    
  }

  /**
   * Update the chordPiano to the provided letter. If this chord piano 
   * is the current progression key, also update all of the other chord 
   * piano's so that they display the correct letter. 
   * 
   * @param {*} chordPiano 
   * @param {*} newLetter 
   */
  function updateChordPianoKey(chordPiano, newLetter) {
    
    chordPiano.selectedKey.noteLetter = newLetter;
    chordPiano.selectedChord.noteLetter = newLetter;

    dispatch({
      type: "UPDATE_KEY",
      id: chordPiano.id,
      payload: {
        noteLetter: newLetter,
        octave: chordPiano.selectedKey.octave ?? 0
      }
    })
  
    if (chordPiano.isProgKey) {
      updateChordLettersGivenKey(chordPiano)
    }
  }

  // processes new key selections
  const handleSlashChordNoteChange = (e) => {
    if (e.target.value === null) return

    updateSlashNote(chordPiano, e.target.value)
  }

  function updateSlashNote(chordPiano, newSlashLetter) {

    if (newSlashLetter === null) return;

    chordRef.current.slashNote = newSlashLetter
  
    dispatch({
      type: "UPDATE_SLASH_CHORD",
      isSlashChord: chordRef.current.slashChord,
      slashNote: chordRef.current.slashNote,
      id: chordPiano.id
    })
  }

  var chordTypeArray = Object.keys(chordMap)

  /**
   * For the provided chordPiano, assumed to be the prog key, update 
   * every other chord piano so that its letter corresponds to the key.
   * e.g. If keyChordPiano is F major, and one of the other chord pianos 
   * is set to A#, change its letter to Bb.
   * 
   * @param {} keyChordPiano 
   */
  function updateChordLettersGivenKey(keyChordPiano) {

    let key = keyChordPiano.selectedChord

    for (let chordPiano of state.chordPianoSet) {

      if (chordPiano.id !== keyChordPiano.id) {
        alignChordLetterWithKey(key, chordPiano)
      }

      // if there's a slash chord, make sure it aligns with the key as well
      if (chordPiano.selectedChord.slash) {
        let slashLetter = chordPiano.selectedChord.slashNote;

        alignSlashNoteWithKey(key, slashLetter, chordPiano)
      }
    }
  }

  /**
   * If the provided chordPiano's slash note letter does not correctly correspond 
   * to the provided key, update it. 
   * 
   * @param {} key 
   * @param {*} slashLetter 
   * @param {*} chordPiano 
   */
  function alignSlashNoteWithKey(key, slashLetter, chordPiano) {

    if (noteIsInScale(key, slashLetter)) {
  
      let newLetter = getScaleAdjustedNoteLetter(key, slashLetter)
  
      if (newLetter !== slashLetter) {

        chordPiano.selectedChord.slashNote = newLetter; 
        dispatch({
          type: "UPDATE_SLASH_CHORD",
          isSlashChord: true,
          slashNote: newLetter,
          id: chordPiano.id
        })
      }
    }
  }

  /**
   * If the provided chordPiano's note letter doesn't align with the provided 
   * key, update the chordPiano's letter accordingly. 
   * 
   * @param {} key 
   * @param {*} chordPiano 
   */
  function alignChordLetterWithKey(key, chordPiano) {

    let chordLetter = chordPiano.selectedChord.noteLetter
  
    if (noteIsInScale(key, chordLetter)) {
      
      let newLetter = getScaleAdjustedNoteLetter(key, chordLetter)
  
      if (newLetter !== chordLetter) {
  
        chordPiano.selectedKey.noteLetter = newLetter;
        chordPiano.selectedChord.noteLetter = newLetter;

        dispatch({
          type: "UPDATE_KEY",
          id: chordPiano.id,
          payload: {
            noteLetter: newLetter,
            octave: chordPiano.selectedKey.octave ?? 0
          }
        })
      }
    }
  }

  function showFlats(chordPiano) {
    return chordPiano.showFlats ||
      chordPiano.selectedKey.noteLetter.includes("b") ||
      (
        chordPiano.selectedChord.slashNote != null &&
        chordPiano.selectedChord.slashNote.includes("b")
      )
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
                
                if (equalChroma(chordRef.current.slashNote, option)) {
                  option = chordRef.current.slashNote;
                  option = getKeyRelativeLetter(option);
                }
                
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
