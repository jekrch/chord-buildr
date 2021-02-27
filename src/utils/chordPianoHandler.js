import { getNoteNumberChord } from "./chordManager"
import { clearPianoSelections } from "./pianoHelper"
import { getNoteNumber, getNoteLetter } from "./noteManager"
import { pianoGenerator } from "./pianoHelper"
import { getChordFromCode } from "./chordCodeHandler"

export function selectChordKeys(chordPiano, dispatch) {
  return selectChordKeysWithType(
    chordPiano,
    chordPiano.selectedChord.type,
    dispatch
  )
}

export function selectChordKeysWithType(chordPiano, type, dispatch) {
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

  dispatch({
    type: "UPDATE_PIANO",
    id: chordPiano.id,
    payload: chordPiano.piano
  })

  updateSelectedChord(chordPiano.id, noteLetter, type, octave, dispatch)
  //playPiano(chordPiano)
}

export function updateSelectedChord(id, noteLetter, type, octave, dispatch) {
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
export function chordIsAlreadySelected(chordPiano, type, letter, octave) {
  var selectedChord = chordPiano.selectedChord
  return (
    hasSelectedNotes(chordPiano.piano) &&
    selectedChord !== null &&
    selectedChord.type === type &&
    selectedChord.noteLetter === letter &&
    selectedChord.octave === octave
  )
}

export function selectNote(chordPiano, octave, noteNumber, dispatch) {
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
}

/***
 * if the note is over 12, find the corresponding note in the next octave
   or if we're at the highest octave, bring the note down 12
 */
export function normalizeNote(noteNumber, octave) {
  while (noteNumber > 12) {
    noteNumber = noteNumber - 12

    if (!(octave >= 2)) {
      octave++
    }
  }

  while (noteNumber < 1) {
    noteNumber = noteNumber + 12

    if (!(octave = 0)) {
      octave--
    }
  }

  return { noteNumber, octave }
}

export function noteIsInvalid(pianoControl, octave, noteNumber) {
  if (!pianoControl || !pianoControl[octave]) return true
}

export function hasSelectedNotes(pianoControl) {
  for (let i = 0; i < pianoControl.length; i++) {
    var pianoOctave = pianoControl[i]

    for (let j = 0; j < pianoOctave.length; j++) {
      if (pianoOctave[j].selected) return true
    }
  }

  return false
}

export function createChordPiano(i, chordCode) {
  var chord = getChordFromCode(chordCode)

  if (chord !== undefined) {
    return {
      id: i,
      piano: pianoGenerator(),
      selectedKey: { noteLetter: chord.noteLetter, noteOctave: chord.octave },
      isProgKey: chord.isKey,
      selectedChord: {
        noteLetter: chord.noteLetter,
        type: chord.type,
        octave: chord.octave
      }
    }
  } else {
    return {
      id: i,
      piano: pianoGenerator(),
      selectedKey: { noteLetter: "C", noteOctave: 0 },
      isProgKey: chord.isKey,
      selectedChord: {
        noteLetter: "C",
        type: "x",
        octave: 0,
        invalidCode: chordCode
      }
    }
  }
}

export function transposeBoard(
  pianoId,
  chordPianoSet,
  originalChordPiano,
  newSelectedKey
) {
  var stepsChanged = getStepsChanged(originalChordPiano, newSelectedKey)

  if (stepsChanged !== 0) {
    for (let i = 0; i < chordPianoSet.length; i++) {
      var chordPiano = chordPianoSet[i]

      if (chordPiano.id === pianoId) continue

      chordPiano.selectedKey = getTransposedSelectedKey(
        chordPiano,
        stepsChanged
      )
    }
  }
}

function getStepsChanged(chordPiano, newSelectedKey) {
  var originalNoteLetter = chordPiano.selectedKey.noteLetter
  var newNoteLetter = newSelectedKey.noteLetter

  var originalNoteNumber = getNoteNumber(originalNoteLetter)
  var newNoteNumber = getNoteNumber(newNoteLetter)

  var stepsDown = newNoteNumber - originalNoteNumber

  //console.log("STEPS CHANGED >>>> " + stepsDown)
  return stepsDown
}

function getTransposedSelectedKey(chordPiano, stepsChanged) {
  var selectedKey = {}

  var originalNoteLetter = chordPiano.selectedKey.noteLetter
  var originalOctave = chordPiano.selectedKey.octave ?? 0

  var originalNoteNumber = getNoteNumber(originalNoteLetter)
  var newNoteNumber = originalNoteNumber + stepsChanged

  var newNote = normalizeNote(newNoteNumber, originalOctave)

  selectedKey.noteLetter = getNoteLetter("C", newNote.noteNumber)
  selectedKey.octave = newNote.octave

  return selectedKey
}
