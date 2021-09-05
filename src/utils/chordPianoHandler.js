import { getNoteNumberChord } from "./chordManager"
import { clearPianoSelections } from "./pianoHelper"
import { getNoteNumber, normalizeNote } from "./noteManager"
import { pianoGenerator } from "./pianoHelper"
import { getChordFromCode } from "./chordCodeHandler"
import {
  getStepsChanged,
  getAbsoluteStepsChanged,
  getTransposedSelectedKey,
  getTransposedNote
} from "./transposer"

export function selectChordKeys(chordPiano) {
  return selectChordKeysWithType(chordPiano, chordPiano.selectedChord, true)
}

export function selectAutomatedChordKeys(chordPiano) {
  return selectChordKeysWithType(chordPiano, chordPiano.selectedChord, false)
}

export function selectChordKeysWithType(
  chordPiano,
  selectedChord,
  userSelection
) {
  // don't select the same chord multiple times
  if (chordIsAlreadySelected(chordPiano)) return

  var chordNotes = getChordNotes(selectedChord, userSelection)

  selectChordNotes(chordNotes, chordPiano)
}

function selectChordNotes(chordNotes, chordPiano) {
  clearPianoSelections(chordPiano.piano)

  chordNotes.notes.forEach((chordNoteNumber) => {
    var note = normalizeNote(chordNoteNumber, chordNotes.octave)

    selectNote(chordPiano, note.octave, note.noteNumber)
  })

  chordPiano.rendered = true
}

export function getChordNotes(selectedChord, userSelection) {
  var noteLetter = selectedChord.noteLetter
  var type = selectedChord.type
  var octave = selectedChord.octave
  var slashNote = selectedChord.slashNote

  // if not octave is provided, use the currently selected octave
  if (!octave || octave === null) {
    octave = 0
  }

  var chordRootNoteNumber = getNoteNumber(noteLetter)
  var slashNoteNumber = getNoteNumber(slashNote)

  var chordNoteNumbers = getNoteNumberChord(chordRootNoteNumber, type)

  var chordNotes = getOctaveAdjustedChordNumbersWithFirstNote(
    octave,
    chordRootNoteNumber,
    chordNoteNumbers,
    slashNoteNumber,
    userSelection
  )
  return chordNotes
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
  chordRootNoteNumber,
  chordNoteNumbers,
  firstNote,
  userSelection
) {
  var chordNotes = {
    rooteNoteNumber: chordRootNoteNumber,
    notes: [],
    octave: octave,
    // determine how many octaves we can increment berfor running off the keyboard
    octaveAllowance: 2 - octave
  }

  if (!firstNote) {
    // if we don't have a first note, just return what we have
    chordNotes.notes = chordNoteNumbers
  } else {
    chordNotes = arrangeChordNotesFromFirstNote(
      chordNotes,
      chordNoteNumbers,
      firstNote,
      userSelection
    )

    // determine whether our base (requested octave)
    // needs to be reduced
    var octaveDecrement = getOctaveDecrementIfNeeded(chordNotes)

    chordNotes.octave -= octaveDecrement
  }

  return chordNotes
}

/**
 * the following arranges the chord notes such that firstNote comes
   first and the number of octaves required to captured the top notes
   doesn't exceed the octave allowance
 * @param {*} chordNotes 
 * @param {*} chordNoteNumbers 
 * @param {*} firstNote 
 * @param {*} octave 
 * @returns 
 */
function arrangeChordNotesFromFirstNote(
  chordNotes,
  chordNoteNumbers,
  firstNote,
  userSelection
) {
  chordNoteNumbers = removeNoteFromArray(chordNoteNumbers, firstNote)

  // start the new array with our first note
  chordNotes.notes.push(firstNote)

  var firstNoteIsLowest = chordNoteNumbers.every((n) => n > firstNote)

  if (firstNoteIsLowest) {
    // if the first note is already the lowest just add the chord notes on top
    //chordNotes.notes = chordNotes.notes.concat(chordNoteNumbers)
    chordNoteNumbers.forEach((note) => {
      if (note - 12 > firstNote) {
        note -= 12
      }

      chordNotes.notes.push(note)
    })
  } else {
    // if the first note isn't the lowest, shift the rest of the chord notes up
    // one octave
    var shiftedUp = shiftChordNotesUpIfBelowFirstNote(
      firstNote,
      chordNoteNumbers,
      chordNotes
    )

    // if we shifted notes up an octave to put the first note at the start
    // try shifting everything down one octave
    // this way slash chords will include the clicked on root even
    // if it isn't the lowest note started at the clicked octave
    if (shiftedUp && chordNotes.octave > 0 && userSelection) {
      chordNotes.octave -= 1
      chordNotes.octaveAllowance += 1
    }
  }
  return chordNotes
}

function shiftChordNotesUpIfBelowFirstNote(
  firstNote,
  chordNoteNumbers,
  chordNotes
) {
  var shiftedUp = false
  chordNoteNumbers.forEach((note) => {
    if (firstNote > note) {
      if (chordNotes.rooteNoteNumber === note) shiftedUp = true

      note += 12
    }
    chordNotes.notes.push(note)
  })

  //console.log("shifted")
  return shiftedUp
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
function getOctaveDecrementIfNeeded(chordNotes) {
  var octaveDecrement = 0

  chordNotes.notes.forEach((note) => {
    var octaveIncrementRequired = Math.ceil(note / 12) - 1

    if (octaveIncrementRequired >= chordNotes.octaveAllowance) {
      var noteOctaveDecrement =
        octaveIncrementRequired - chordNotes.octaveAllowance
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
  noteKey.isStopping = null
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

export function getLowestSelectedNote(pianoControl) {
  for (let i = 0; i < pianoControl.length; i++) {
    var pianoOctave = pianoControl[i]

    for (let j = 0; j < pianoOctave.length; j++) {
      if (pianoOctave[j].selected) {
        return { octave: i, noteNumber: j }
      }
    }
  }

  return
}

export function getLowestSelectedAbsoluteNote(pianoControl) {
  var lowestNote = getLowestSelectedNote(pianoControl)
  if (!lowestNote) return

  return lowestNote.noteNumber + lowestNote.octave * 12
}

export function createChordPiano(i, chordCode) {
  var chord = getChordFromCode(chordCode)

  if (chord !== undefined) {
    return {
      id: i,
      piano: pianoGenerator(),
      selectedKey: { noteLetter: chord.noteLetter, octave: chord.octave },
      showFlats:
        chord.noteLetter.includes("b") ||
        (chord.slashNote != null && chord.slashNote.includes("b")),
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
    return
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
  var absoluteStepsChanged = getAbsoluteStepsChanged(
    originalChordPiano,
    newSelectedKey
  )

  //console.log("absolute change " + absoluteStepsChanged)

  if (absoluteStepsChanged !== 0) {
    for (let i = 0; i < chordPianoSet.length; i++) {
      var chordPiano = chordPianoSet[i]

      var originalLowestAbsoluteNote = getLowestAbsoluteNoteFromSelectedChord(
        chordPiano.selectedChord,
        false
      )

      chordPiano.selectedChord.slashNote = getTransposedNote(
        chordPiano.selectedChord.slashNote,
        stepsChanged
      )

      // don't change the root chord
      if (chordPiano.id === pianoId) {
        continue
      }

      var newChordPianoSelectedKey = getTransposedSelectedKey(
        chordPiano,
        stepsChanged
      )

      setNewChordKey(chordPiano, newChordPianoSelectedKey)

      var newLowestNote = getLowestAbsoluteNoteFromSelectedChord(
        chordPiano.selectedChord,
        true
      )

      chordPiano = moveChordTowardTonicIfNeeded(
        newLowestNote,
        originalLowestAbsoluteNote,
        absoluteStepsChanged,
        chordPiano
      )

      selectAutomatedChordKeys(chordPiano)
    }
  }
}
function setNewChordKey(chordPiano, newChordPianoSelectedKey) {
  chordPiano.selectedKey = newChordPianoSelectedKey
  chordPiano.selectedChord.noteLetter = newChordPianoSelectedKey.noteLetter
  chordPiano.selectedChord.octave = newChordPianoSelectedKey.octave
  chordPiano.rendered = false
}

/**
 * When transposing there are scenarios where the tonic might move 2 absolute
 * notes up, but a transposed chord would be shifted down 10 notes. The
 * following attempts to normalize the movement of the transposed to
 * match the tonic as much as possible
 *
 * @param {} newLowestNote
 * @param {*} originalLowestAbsoluteNote
 * @param {*} absoluteStepsChanged
 * @param {*} chordPiano
 * @returns
 */
function moveChordTowardTonicIfNeeded(
  newLowestNote,
  originalLowestAbsoluteNote,
  absoluteStepsChanged,
  chordPiano
) {
  var newChordAbsoluteChange = newLowestNote - originalLowestAbsoluteNote
  var keyChangeDiffSteps = newChordAbsoluteChange - absoluteStepsChanged

  //console.log("changing " + newChordAbsoluteChange + " . " + keyChangeDiffSteps)

  // if the difference between the absolute note change in the tonic
  // is greater than 6 notes, adjust the chord so that it is closer
  // the the new absolute position of the tonic
  if (Math.abs(keyChangeDiffSteps) > 6) {
    // if we ascended an octave, descend if possible
    if (keyChangeDiffSteps > 0) {
      if (chordPiano.selectedKey.octave > 0) {
        chordPiano.selectedKey.octave--
        chordPiano.selectedChord.octave--
        chordPiano.rendered = false
      }
    } else {
      // ascend for descending chords if possible
      if (chordPiano.selectedKey.octave < 2) {
        //console.log("go up")
        chordPiano.selectedKey.octave++
        chordPiano.selectedChord.octave++
        chordPiano.rendered = false
      }
    }
  }

  return chordPiano
}

function getLowestAbsoluteNoteFromSelectedChord(selectedChord, transposing) {
  var originalChordNotes = getChordNotes(selectedChord, !transposing)

  //console.log(originalChordNotes)
  return originalChordNotes.notes[0] + originalChordNotes.octave * 12
}
