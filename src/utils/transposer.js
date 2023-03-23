import { updateFlatOrSharpLetter } from "./chordCodeHandler"
import { getNoteNumber, getNoteLetter, normalizeNote } from "./noteManager"

// returns the note numbers for the specified chord with the indicated
// transposition applied to each note
export function shiftChord(originalKeyNumber, newKeyNumber, chordNoteNumbers) {
  var negativeTransposeModifier = originalKeyNumber - newKeyNumber

  // determine whether the new chord needs to shift up or down
  // and octave in order to stay within the keyboard range
  var requiredOctaveModifier = getRequiredOctaveModifier(
    negativeTransposeModifier,
    chordNoteNumbers
  )

  var newChordNoteNumbers = []

  for (var i = 0; i < chordNoteNumbers.length; i++) {
    var noteNumber = chordNoteNumbers[i] - negativeTransposeModifier

    // if the chord needed to be shifted up or down and octave
    // apply that here
    noteNumber = noteNumber + requiredOctaveModifier

    // in the rare case that we're still outside the range
    // address that here
    noteNumber = sanitizeKeyLocation(noteNumber)

    newChordNoteNumbers.push(noteNumber)
  }

  return newChordNoteNumbers
}

// if the note goes above or below the keyboard range, move it
function sanitizeKeyLocation(noteNumber) {
  if (noteNumber < 0) return noteNumber + 12

  if (noteNumber > 24) return noteNumber - 12

  return noteNumber
}

// provides a modifier for all transposed notes based on whether
// the required transposition would produce any notes that either
// go below or above the available keyboard range (24)
function getRequiredOctaveModifier(
  negativeTransposeModifier,
  chordNoteNumbers
) {
  var tooLow
  var tooHigh

  for (var i = 0; i < chordNoteNumbers.length; i++) {
    var noteNumber = chordNoteNumbers[i] - negativeTransposeModifier

    if (noteNumber < 0) tooLow = true

    if (noteNumber > 24) tooLow = true
  }

  if (tooLow && !tooHigh) return 12

  if (tooHigh && !tooLow) return -12

  // by default, handle this case by case
  return 0
}

export function getStepsChanged(chordPiano, newSelectedKey) {
  var originalNoteLetter = chordPiano.selectedChord.noteLetter
  var newNoteLetter = newSelectedKey.noteLetter

  var originalNoteNumber = getNoteNumber(originalNoteLetter)
  var newNoteNumber = getNoteNumber(newNoteLetter)

  var stepsChanged = newNoteNumber - originalNoteNumber

  return stepsChanged
}

export function getAbsoluteStepsChanged(chordPiano, newSelectedKey) {
  var relativeStepsChanged = getStepsChanged(chordPiano, newSelectedKey)
  var octaveChange = newSelectedKey.octave - chordPiano.selectedChord.octave

  return relativeStepsChanged + 12 * octaveChange
}

export function getTransposedSelectedNote(chordPiano, stepsChanged) {
  var selectedNote = {}

  var originalNoteLetter = chordPiano.selectedChord.noteLetter
  var originalOctave = chordPiano.selectedChord.octave ?? 0

  var originalNoteNumber = getNoteNumber(originalNoteLetter)
  var newNoteNumber = originalNoteNumber + stepsChanged

  var newNote = normalizeNote(newNoteNumber, originalOctave)

  // get note letter converted to sharp or flat depending on settings
  var noteLetter = getNoteLetter("C", newNote.noteNumber)

  selectedNote.noteLetter = updateFlatOrSharpLetter(
    chordPiano.showFlats,
    noteLetter
  )

  selectedNote.octave = newNote.octave

  return selectedNote
}

export function getTransposedNote(originalNoteLetter, stepsChanged) {
  if (originalNoteLetter === undefined || originalNoteLetter === "")
    return originalNoteLetter

  var originalNoteNumber = getNoteNumber(originalNoteLetter)

  var newNoteNumber = originalNoteNumber + stepsChanged

  if (newNoteNumber === 0) newNoteNumber = 12

  return getNoteLetter("C", newNoteNumber)
}
