import { getNoteNumberChord } from "./chordManager"
import { clearPianoSelections } from "./pianoHelper"
import { getNoteNumber, getNoteLetter } from "./noteManager"
import { pianoGenerator } from "./pianoHelper"
import { getChordFromCode } from "./chordCodeHandler"

export function selectChordKeys(chordPiano) {
  return selectChordKeysWithType(chordPiano, chordPiano.selectedChord.type)
}

export function selectChordKeysWithType(chordPiano, type) {
  var noteLetter = chordPiano.selectedKey.noteLetter

  // if not octave is provided, use the currently selected octave
  var octave = chordPiano.selectedKey.octave

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

    selectNote(chordPiano, octave, chordNoteNumber)
  }

  chordPiano.rendered = true
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
    selectedChord.octave === octave &&
    chordPiano.rendered === true
  )
}

export function selectNote(chordPiano, octave, noteNumber) {
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

    if (octave < 2) {
      octave++
    }
  }

  while (noteNumber < 1) {
    noteNumber = noteNumber + 12

    if (octave !== 0) {
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
      selectedKey: { noteLetter: chord.noteLetter, octave: chord.octave },
      isProgKey: chord.isKey,
      selectedChord: {
        noteLetter: chord.noteLetter,
        type: chord.type,
        octave: chord.octave,
        slash: chord.slash,
        slashNote: chord.slashNote
      }
    }
  } else {
    return {
      id: i,
      piano: pianoGenerator(),
      selectedKey: { noteLetter: "C", octave: 0 },
      isProgKey: false,
      selectedChord: {
        noteLetter: "C",
        type: "x",
        octave: 0,
        invalidCode: chordCode
      }
    }
  }
}

export function transposePianoBoard(
  pianoId,
  chordPianoSet,
  originalChordPiano,
  newSelectedKey
) {
  var stepsChanged = getStepsChanged(originalChordPiano, newSelectedKey)

  if (stepsChanged !== 0) {
    for (let i = 0; i < chordPianoSet.length; i++) {
      var chordPiano = chordPianoSet[i]

      // don't change the root chord
      if (chordPiano.id === pianoId) continue

      chordPiano.selectedKey = getTransposedSelectedKey(
        chordPiano,
        stepsChanged
      )

      chordPiano.selectedChord.slashNote = getTransposedNote(
        chordPiano.selectedChord.slashNote,
        stepsChanged
      )

      chordPiano.selectedChord.noteLetter = chordPiano.selectedKey.noteLetter
      chordPiano.selectedChord.octave = chordPiano.selectedKey.octave
      chordPiano.rendered = false

      selectChordKeys(chordPiano)
    }
  }
}

function getStepsChanged(chordPiano, newSelectedKey) {
  var originalNoteLetter = chordPiano.selectedChord.noteLetter
  var newNoteLetter = newSelectedKey.noteLetter

  var originalNoteNumber = getNoteNumber(originalNoteLetter)
  var newNoteNumber = getNoteNumber(newNoteLetter)

  var stepsChanged = newNoteNumber - originalNoteNumber

  return stepsChanged
}

function getTransposedSelectedKey(chordPiano, stepsChanged) {
  var selectedKey = {}

  var originalNoteLetter = chordPiano.selectedChord.noteLetter
  var originalOctave = chordPiano.selectedChord.octave ?? 0

  var originalNoteNumber = getNoteNumber(originalNoteLetter)
  var newNoteNumber = originalNoteNumber + stepsChanged

  var newNote = normalizeNote(newNoteNumber, originalOctave)

  selectedKey.noteLetter = getNoteLetter("C", newNote.noteNumber)
  selectedKey.octave = newNote.octave

  return selectedKey
}

function getTransposedNote(originalNoteLetter, stepsChanged) {
  if (originalNoteLetter === undefined || originalNoteLetter === "")
    return originalNoteLetter

  var originalNoteNumber = getNoteNumber(originalNoteLetter)

  var newNoteNumber = originalNoteNumber + stepsChanged

  if (newNoteNumber === 0) newNoteNumber = 12

  return getNoteLetter("C", newNoteNumber)
}
