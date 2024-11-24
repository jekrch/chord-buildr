import { updateFlatOrSharpLetter } from "./chordCodeHandler"
import { ChordPiano, SelectedKey } from "./chordPianoHandler"
import { getNoteNumber, getNoteLetter, normalizeNote } from "./noteManager"


// returns the note numbers for the specified chord with the indicated
// transposition applied to each note
export function shiftChord(
  originalKeyNumber: number,
  newKeyNumber: number,
  chordNoteNumbers: number[]
): number[] {
  const negativeTransposeModifier = originalKeyNumber - newKeyNumber

  // determine whether the new chord needs to shift up or down
  // and octave in order to stay within the keyboard range
  const requiredOctaveModifier = getRequiredOctaveModifier(
    negativeTransposeModifier,
    chordNoteNumbers
  )

  const newChordNoteNumbers: number[] = []

  for (let i = 0; i < chordNoteNumbers.length; i++) {
    let noteNumber = chordNoteNumbers[i] - negativeTransposeModifier

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
function sanitizeKeyLocation(noteNumber: number): number {
  if (noteNumber < 0) return noteNumber + 12

  if (noteNumber > 24) return noteNumber - 12

  return noteNumber
}

// provides a modifier for all transposed notes based on whether
// the required transposition would produce any notes that either
// go below or above the available keyboard range (24)
function getRequiredOctaveModifier(
  negativeTransposeModifier: number,
  chordNoteNumbers: number[]
): number {
  let tooLow = false
  let tooHigh = false

  for (let i = 0; i < chordNoteNumbers.length; i++) {
    const noteNumber = chordNoteNumbers[i] - negativeTransposeModifier

    if (noteNumber < 0) tooLow = true

    if (noteNumber > 24) tooHigh = true 
  }

  if (tooLow && !tooHigh) return 12

  if (tooHigh && !tooLow) return -12

  // by default, handle this case by case
  return 0
}

export function getStepsChanged(
  chordPiano: ChordPiano,
  newSelectedKey: SelectedKey
): number {
  const originalNoteLetter = chordPiano.selectedChord.noteLetter
  const newNoteLetter = newSelectedKey.noteLetter

  const originalNoteNumber = getNoteNumber(originalNoteLetter)
  const newNoteNumber = getNoteNumber(newNoteLetter)

  return newNoteNumber! - originalNoteNumber!
}

export function getAbsoluteStepsChanged(
  chordPiano: ChordPiano,
  newSelectedKey: SelectedKey
): number {
  const relativeStepsChanged = getStepsChanged(chordPiano, newSelectedKey)
  const octaveChange = newSelectedKey.octave - chordPiano.selectedChord.octave!

  return relativeStepsChanged + 12 * octaveChange
}

export function getTransposedSelectedNote(
  chordPiano: ChordPiano,
  stepsChanged: number
): SelectedKey {
  const originalNoteLetter = chordPiano.selectedChord.noteLetter
  const originalOctave = chordPiano.selectedChord.octave ?? 0

  const originalNoteNumber = getNoteNumber(originalNoteLetter)
  const newNoteNumber = originalNoteNumber! + stepsChanged

  const newNote = normalizeNote(newNoteNumber, originalOctave)

  // get note letter converted to sharp or flat depending on settings
  const noteLetter = getNoteLetter("C", newNote.noteNumber)

  return {
    noteLetter: updateFlatOrSharpLetter(chordPiano.showFlats, noteLetter),
    octave: newNote.octave,
  }
}

export function getTransposedNote(
  originalNoteLetter: string | undefined | null,
  stepsChanged: number
): string {
  if (originalNoteLetter === undefined || originalNoteLetter === "")
    return originalNoteLetter || ""

  let newNoteNumber = getNoteNumber(originalNoteLetter)! + stepsChanged

  if (newNoteNumber === 0) newNoteNumber = 12

  return getNoteLetter("C", newNoteNumber)
}