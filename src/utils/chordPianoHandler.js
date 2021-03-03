import { getNoteNumberChord } from "./chordManager"
import { clearPianoSelections } from "./pianoHelper"
import { getNoteNumber, getNoteLetter } from "./noteManager"
import { pianoGenerator } from "./pianoHelper"
import { getChordFromCode } from "./chordCodeHandler"

export function selectChordKeys(chordPiano) {
  return selectChordKeysWithType(chordPiano, chordPiano.selectedChord)
}

export function selectChordKeysWithType(chordPiano, selectedChord) {
  var noteLetter = selectedChord.noteLetter
  var type = selectedChord.type
  var octave = selectedChord.octave
  var slashNote = selectedChord.slashNote

  // if not octave is provided, use the currently selected octave
  if (!octave || octave === null) {
    octave = 0
  }

  // don't select the same chord multiple times
  if (chordIsAlreadySelected(chordPiano)) return

  var chordNoteNumber = getNoteNumber(noteLetter)
  var slashNoteNumber = getNoteNumber(slashNote)

  var chordNoteNumbers = getNoteNumberChord(chordNoteNumber, type)

  clearPianoSelections(chordPiano.piano)

  var chordNotes = getOctaveAdjustedChordNumbersWithFirstNote(
    octave,
    chordNoteNumbers,
    slashNoteNumber
  )

  chordNotes.notes.forEach((chordNoteNumber) => {
    var note = normalizeNote(chordNoteNumber, chordNotes.octave)

    selectNote(chordPiano, note.octave, note.noteNumber)
  })

  chordPiano.rendered = true
}

/**
 * If there is a first note provided, this arranges the chordNoteNumbers such that
 * the firstNote comes first, while considering the octaves available for the
 * subsequent notes
 *
 * @param {*} octave
 * @param {*} chordNoteNumbers
 * @param {*} firstNote
 */
function getOctaveAdjustedChordNumbersWithFirstNote(
  octave,
  chordNoteNumbers,
  firstNote
) {
  var chordNotes = {}

  // determine how many octaves we can increment berfor running off the keyboard
  var octaveAllowance = 2 - octave

  if (!firstNote) {
    // if we don't have a first note, just return what we have
    chordNotes.notes = chordNoteNumbers
    chordNotes.octave = octave
  } else {
    // the following arranges the chord notes such that firstNote comes
    // first and the number of octaves required to captured the top notes
    // doesn't exceed the octave allowance
    chordNotes.notes = []

    chordNoteNumbers = removeNoteFromArray(chordNoteNumbers, firstNote)

    // start the new array with our first note
    chordNotes.notes.push(firstNote)

    var firstNoteIsLowest = chordNoteNumbers.every((n) => n > firstNote)

    if (firstNoteIsLowest) {
      // if the first note is already the lowest just add the chord notes on top
      //chordNotes.notes = chordNotes.notes.concat(chordNoteNumbers)

      chordNoteNumbers.forEach((note) => {
        if (note - 12 > firstNote) note -= 12
        chordNotes.notes.push(note)
      })
    } else {
      // if the first note isn't the lowest, shift the rest of the chord notes up
      // one octave
      shiftChordNotesUpIfBelowFirstNote(firstNote, chordNoteNumbers, chordNotes)
    }

    // determine whether our base (requested octave)
    // needs to be reduced
    var octaveDecrement = getOctaveDecrementIfNeeded(
      chordNotes,
      octaveAllowance
    )

    chordNotes.octave = octave - octaveDecrement
  }

  return chordNotes
}

function shiftChordNotesUpIfBelowFirstNote(
  firstNote,
  chordNoteNumbers,
  chordNotes
) {
  chordNoteNumbers.forEach((note) => {
    if (firstNote > note) note += 12

    chordNotes.notes.push(note)
  })
}

/**
 * Given the provided octaveAllowance, determine whether the base octave
 * needs to be reduced (without altering the note order) and if so
 * by how much (the octave decrement)
 *
 * @param {*} chordNotes      the note numbers for the chord
 * @param {*} octaveAllowance additional octaves that may be accessed
 *                            without running off keyboard
 */
function getOctaveDecrementIfNeeded(chordNotes, octaveAllowance) {
  var octaveDecrement = 0

  chordNotes.notes.forEach((note) => {
    var octaveIncrementRequired = Math.ceil(note / 12) - 1

    if (octaveIncrementRequired >= octaveAllowance) {
      var noteOctaveDecrement = octaveIncrementRequired - octaveAllowance
      if (noteOctaveDecrement > octaveDecrement)
        octaveDecrement = noteOctaveDecrement
    }
  })

  return octaveDecrement
}

/**
 * this removes any instances of the provided note in the array
 * whether in the first or any later octave (factors of 12)
 * @param {*} array
 * @param {*} note
 */
function removeNoteFromArray(array, note) {
  return array.filter((n) => !((n - note) % 12 === 0))
}

/**
 * Determines whether the currently selected chord matches the provided
 * type, letter, and octave
 */
export function chordIsAlreadySelected(chordPiano) {
  return hasSelectedNotes(chordPiano.piano) && chordPiano.rendered === true
}

export function selectNote(chordPiano, octave, noteNumber) {
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
        invalidCode: chordCode,
        slash: false
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

      chordPiano.selectedChord.slashNote = getTransposedNote(
        chordPiano.selectedChord.slashNote,
        stepsChanged
      )

      // don't change the root chord
      if (chordPiano.id === pianoId) {
        continue
      }

      chordPiano.selectedKey = getTransposedSelectedKey(
        chordPiano,
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
