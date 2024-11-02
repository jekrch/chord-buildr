// @ts-ignore
import { getNoteNumberChord, getScaleAdjustedNoteLetter } from "./chordManager"
// @ts-ignore
import { clearPianoSelections, pianoGenerator } from "./pianoHelper"
// @ts-ignore
import { getNoteNumber, normalizeNote } from "./noteManager"
// @ts-ignore
import { getChordFromCode } from "./chordCodeHandler"
import {
  getStepsChanged,
  getAbsoluteStepsChanged,
  getTransposedSelectedNote,
  getTransposedNote
  // @ts-ignore
} from "./transposer"

export interface Note {
  octave: number
  noteNumber: number
}

export interface NoteKey {
  selected: boolean
  isStopping: boolean | null
}

export interface ChordNotes {
  rooteNoteNumber: number
  notes: number[]
  octave: number
  octaveAllowance: number
}

export interface SelectedKey {
  noteLetter: string
  octave: number
}

export interface SelectedChord {
  noteLetter?: string
  type?: string
  octave?: number
  slash?: boolean
  isKey?:boolean
  slashNote?: string | null
}

export interface ChordPiano {
  id: number
  piano?: NoteKey[][]
  selectedKey: SelectedKey
  showFlats?: boolean
  isProgKey?: boolean
  selectedChord: SelectedChord
  rendered?: boolean
}

export function selectChordKeys(chordPiano: ChordPiano): void {
  return selectChordKeysWithType(chordPiano, chordPiano.selectedChord, true)
}

export function selectAutomatedChordKeys(chordPiano: ChordPiano): void {
  return selectChordKeysWithType(chordPiano, chordPiano.selectedChord, false)
}

export function selectChordKeysWithType(
  chordPiano: ChordPiano,
  selectedChord: SelectedChord,
  userSelection: boolean
): void {
  // don't select the same chord multiple times
  if (chordIsAlreadySelected(chordPiano)) return

  const chordNotes = getChordNotes(selectedChord, userSelection)

  selectChordNotes(chordNotes, chordPiano)
}

function selectChordNotes(chordNotes: ChordNotes, chordPiano: ChordPiano): void {
  clearPianoSelections(chordPiano.piano)

  chordNotes.notes.forEach((chordNoteNumber) => {
    const note = normalizeNote(chordNoteNumber, chordNotes.octave)

    selectNote(chordPiano, note.octave, note.noteNumber)
  })

  chordPiano.rendered = true
}

export function getChordNotes(selectedChord: SelectedChord, userSelection: boolean): ChordNotes {
  const noteLetter = selectedChord.noteLetter
  const type = selectedChord.type
  const octave = selectedChord.octave
  const slashNote = selectedChord.slashNote

  // if not octave is provided, use the currently selected octave
  const finalOctave = !octave || octave === null ? 0 : octave

  const chordRootNoteNumber = getNoteNumber(noteLetter)
  const slashNoteNumber = getNoteNumber(slashNote)

  const chordNoteNumbers = getNoteNumberChord(chordRootNoteNumber, type)

  return getOctaveAdjustedChordNumbersWithFirstNote(
    finalOctave,
    chordRootNoteNumber,
    chordNoteNumbers,
    slashNoteNumber,
    userSelection
  )
}

/**
 * If there is a first note provided, this arranges the chordNoteNumbers such that
 * the firstNote comes first, while considering the octaves available for the
 * subsequent notes
 *
 * @param {number} octave
 * @param {number} chordRootNoteNumber
 * @param {number[]} chordNoteNumbers
 * @param {number | null} firstNote
 * @param {boolean} userSelection
 */
function getOctaveAdjustedChordNumbersWithFirstNote(
  octave: number,
  chordRootNoteNumber: number,
  chordNoteNumbers: number[],
  firstNote: number | null,
  userSelection: boolean
): ChordNotes {
  let chordNotes: ChordNotes = {
    rooteNoteNumber: chordRootNoteNumber,
    notes: [],
    octave: octave,
    // determine how many octaves we can increment before running off the keyboard
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
    const octaveDecrement = getOctaveDecrementIfNeeded(chordNotes)

    chordNotes.octave -= octaveDecrement
  }

  return chordNotes
}

/**
 * the following arranges the chord notes such that firstNote comes
   first and the number of octaves required to captured the top notes
   doesn't exceed the octave allowance
 * @param {ChordNotes} chordNotes 
 * @param {number[]} chordNoteNumbers 
 * @param {number} firstNote 
 * @param {boolean} userSelection 
 * @returns {ChordNotes}
 */
function arrangeChordNotesFromFirstNote(
  chordNotes: ChordNotes,
  chordNoteNumbers: number[],
  firstNote: number,
  userSelection: boolean
): ChordNotes {
  chordNoteNumbers = removeNoteFromArray(chordNoteNumbers, firstNote)

  // start the new array with our first note
  chordNotes.notes.push(firstNote)

  const firstNoteIsLowest = chordNoteNumbers.every((n) => n > firstNote)

  if (firstNoteIsLowest) {
    // if the first note is already the lowest just add the chord notes on top
    chordNoteNumbers.forEach((note) => {
      if (note - 12 > firstNote) {
        note -= 12
      }

      chordNotes.notes.push(note)
    })
  } else {
    // if the first note isn't the lowest, shift the rest of the chord notes up
    // one octave
    const shiftedUp = shiftChordNotesUpIfBelowFirstNote(
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
  firstNote: number,
  chordNoteNumbers: number[],
  chordNotes: ChordNotes
): boolean {
  let shiftedUp = false
  chordNoteNumbers.forEach((note) => {
    if (firstNote > note) {
      if (chordNotes.rooteNoteNumber === note) shiftedUp = true

      note += 12
    }
    chordNotes.notes.push(note)
  })

  return shiftedUp
}

/**
 * Given the provided octaveAllowance, determine whether the base octave
 * needs to be reduced (without altering the note order) and if so
 * by how much (the octave decrement)
 *
 * @param {ChordNotes} chordNotes      the note numbers for the chord
 * @returns {number} octaveDecrement   additional octaves that may be accessed
 *                                     without running off keyboard
 */
function getOctaveDecrementIfNeeded(chordNotes: ChordNotes): number {
  let octaveDecrement = 0

  chordNotes.notes.forEach((note) => {
    const octaveIncrementRequired = Math.ceil(note / 12) - 1

    if (octaveIncrementRequired >= chordNotes.octaveAllowance) {
      const noteOctaveDecrement =
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
 * @param {number[]} array
 * @param {number} note
 */
function removeNoteFromArray(array: number[], note: number): number[] {
  return array.filter((n) => !((n - note) % 12 === 0))
}

/**
 * Determines whether the currently selected chord matches the provided
 * type, letter, and octave
 */
export function chordIsAlreadySelected(chordPiano: ChordPiano): boolean {
  return hasSelectedNotes(chordPiano.piano!) && chordPiano.rendered === true
}

export function selectNote(chordPiano: ChordPiano, octave: number, noteNumber: number): void {
  const piano = chordPiano.piano

  if (noteIsInvalid(piano!, octave, noteNumber)) {
    console.log("skipped invalid note: " + octave + " : " + noteNumber)
    return
  }

  const noteKey = piano![octave][noteNumber - 1]

  if (!noteKey || noteKey.selected) {
    console.log("SKIPPED INVALID NOTE: " + octave + " : " + noteNumber)
    return
  }

  noteKey.selected = true
  noteKey.isStopping = null
}

export function noteIsInvalid(pianoControl: NoteKey[][], octave: number, noteNumber: number): boolean {
  return !pianoControl || !pianoControl[octave]
}

export function hasSelectedNotes(pianoControl: NoteKey[][]): boolean {
  for (let i = 0; i < pianoControl.length; i++) {
    const pianoOctave = pianoControl[i]

    for (let j = 0; j < pianoOctave.length; j++) {
      if (pianoOctave[j].selected) return true
    }
  }

  return false
}

export function getLowestSelectedNote(pianoControl: NoteKey[][]): Note | undefined {
  for (let i = 0; i < pianoControl.length; i++) {
    const pianoOctave = pianoControl[i]

    for (let j = 0; j < pianoOctave.length; j++) {
      if (pianoOctave[j].selected) {
        return { octave: i, noteNumber: j }
      }
    }
  }

  return undefined
}

export function getLowestSelectedAbsoluteNote(pianoControl: NoteKey[][]): number | undefined {
  const lowestNote = getLowestSelectedNote(pianoControl)
  if (!lowestNote) return undefined

  return lowestNote.noteNumber + lowestNote.octave * 12
}

export function createChordPiano(i: number, chordCode: string): ChordPiano | undefined {
  const chord = getChordFromCode(chordCode)

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
  }
}

export function transposePianoBoard(
  pianoId: number,
  chordPianoSet: ChordPiano[],
  originalChordPiano: ChordPiano,
  newSelectedKey: SelectedKey
): void {
  const stepsChanged = getStepsChanged(originalChordPiano, newSelectedKey)
  const absoluteStepsChanged = getAbsoluteStepsChanged(
    originalChordPiano,
    newSelectedKey
  )

  if (absoluteStepsChanged !== 0) {
    for (let i = 0; i < chordPianoSet.length; i++) {
      const chordPiano = chordPianoSet[i]

      const originalLowestAbsoluteNote = getLowestAbsoluteNoteFromSelectedChord(
        chordPiano.selectedChord,
        false
      )

      let slashLetter = getTransposedNote(
        chordPiano.selectedChord.slashNote,
        stepsChanged
      )

      chordPiano.selectedChord.slashNote = getScaleAdjustedNoteLetter(newSelectedKey, slashLetter)
      
      // don't change the root chord
      if (chordPiano.id === pianoId) {
        continue
      }

      let chordNote = getTransposedSelectedNote(
        chordPiano,
        stepsChanged
      )

      chordNote.noteLetter = getScaleAdjustedNoteLetter(newSelectedKey, chordNote.noteLetter)
      
      setNewChordKey(chordPiano, chordNote)

      const newLowestNote = getLowestAbsoluteNoteFromSelectedChord(
        chordPiano.selectedChord,
        true
      )

      moveChordTowardTonicIfNeeded(
        newLowestNote,
        originalLowestAbsoluteNote,
        absoluteStepsChanged,
        chordPiano
      )

      selectAutomatedChordKeys(chordPiano)
    }
  }
}

function setNewChordKey(chordPiano: ChordPiano, newChordPianoSelectedKey: SelectedKey): void {
  chordPiano.selectedKey = newChordPianoSelectedKey
  chordPiano.selectedChord.noteLetter = newChordPianoSelectedKey.noteLetter
  chordPiano.selectedChord.octave = newChordPianoSelectedKey.octave
  chordPiano.rendered = false
}

/**
 * When transposing there are scenarios where the tonic might move 2 absolute
 * notes up, but a transposed chord would be shifted down 10 notes. The
 * following attempts to normalize the movement of the transposed chord to
 * match the tonic as much as possible
 *
 * @param {number} newLowestNote
 * @param {number} originalLowestAbsoluteNote
 * @param {number} absoluteStepsChanged
 * @param {ChordPiano} chordPiano
 * @returns {ChordPiano}
 */
function moveChordTowardTonicIfNeeded(
  newLowestNote: number,
  originalLowestAbsoluteNote: number,
  absoluteStepsChanged: number,
  chordPiano: ChordPiano
): ChordPiano {
  const newChordAbsoluteChange = newLowestNote - originalLowestAbsoluteNote
  const keyChangeDiffSteps = newChordAbsoluteChange - absoluteStepsChanged

  // if the difference between the absolute note change in the tonic
  // is greater than 6 notes, adjust the chord so that it is closer
  // the the new absolute position of the tonic
  if (Math.abs(keyChangeDiffSteps) > 6) {
    // if we ascended an octave, descend if possible
    if (keyChangeDiffSteps > 0) {
      if (chordPiano.selectedKey.octave > 0) {
        chordPiano.selectedKey.octave--

        if (chordPiano.selectedChord?.octave)
          chordPiano.selectedChord.octave--
        
        chordPiano.rendered = false
      }
    } else {
      // ascend for descending chords if possible
      if (chordPiano.selectedKey.octave < 2) {
        chordPiano.selectedKey.octave++

        if (chordPiano.selectedChord?.octave)
          chordPiano.selectedChord.octave++

        chordPiano.rendered = false
      }
    }
  }

  return chordPiano
}

function getLowestAbsoluteNoteFromSelectedChord(selectedChord: SelectedChord, transposing: boolean): number {
  const originalChordNotes = getChordNotes(selectedChord, !transposing)
  return originalChordNotes.notes[0] + originalChordNotes.octave * 12
}