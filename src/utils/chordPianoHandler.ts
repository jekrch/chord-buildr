import { getNoteNumberChord, getScaleAdjustedNoteLetter } from "./chordManager"
import { getNoteNumber, normalizeNote } from "./noteManager"
import {
  getStepsChanged,
  getAbsoluteStepsChanged,
  getTransposedSelectedNote,
  getTransposedNote
} from "./transposer"


export interface NoteKey {
  selected: boolean
  note: string
  noteNumber: number
  octave: number
  color: 'white' | 'black'
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
  noteLetter: string
  type: string
  octave: number
  slash?: boolean
  isKey?:boolean
  slashNote?: string | null
  position?: number
}

/**
 * a chord in the progression, as the store keeps it. only what the chord
 * is: the keys it has down on its piano are worked out from it (see
 * getChordKeys), and whether it's playing lives in the playback store
 */
export interface ChordPiano {
  id: number
  showFlats?: boolean
  isProgKey?: boolean
  selectedChord: SelectedChord
  // id of the section break right after this chord, if there is one. ids
  // only keep a break's identity while it's dragged; they aren't saved
  breakAfter?: number
}

// the piano on each card: three octaves, 12 keys each
export const PIANO_OCTAVES = 3
export const PIANO_KEY_COUNT = PIANO_OCTAVES * 12

/**
 * the keys a chord has down on its piano, as indexes into its 36 keys
 * (octave * 12 + semitone above that octave's C), lowest first. notes the
 * voicing runs off the keyboard with are left out
 */
export function getChordKeys(selectedChord: SelectedChord): number[] {
  const chordNotes = getChordNotes(selectedChord, true)
  const keys = new Set<number>()

  for (const chordNoteNumber of chordNotes.notes) {
    const { octave, noteNumber } = normalizeNote(chordNoteNumber, chordNotes.octave)

    if (!noteNumber || octave < 0 || octave >= PIANO_OCTAVES) continue

    keys.add(octave * 12 + noteNumber - 1)
  }

  return [...keys].sort((a, b) => a - b)
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

  // a root that isn't a note plays nothing
  if (chordRootNoteNumber === undefined) {
    return { rooteNoteNumber: 0, notes: [], octave: finalOctave, octaveAllowance: 0 }
  }

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
  firstNote: number | null | undefined,
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

export function transposePianoBoard(
  pianoId: number,
  chordPianoSet: ChordPiano[] | undefined,
  originalChordPiano: ChordPiano,
  newSelectedKey: SelectedKey
): void {
  const stepsChanged = getStepsChanged(originalChordPiano, newSelectedKey)
  const absoluteStepsChanged = getAbsoluteStepsChanged(
    originalChordPiano,
    newSelectedKey
  )

  if (absoluteStepsChanged !== 0 && chordPianoSet?.length) {
    for (const chordPiano of chordPianoSet) {

      const originalLowestAbsoluteNote = getLowestAbsoluteNoteFromSelectedChord(
        chordPiano.selectedChord,
        false
      )

      const slashLetter = getTransposedNote(
        chordPiano.selectedChord.slashNote,
        stepsChanged
      )

      chordPiano.selectedChord.slashNote = getScaleAdjustedNoteLetter(newSelectedKey, slashLetter)
      
      // don't change the root chord
      if (chordPiano.id === pianoId) {
        continue
      }

      const chordNote = getTransposedSelectedNote(
        chordPiano,
        stepsChanged
      )

      chordNote.noteLetter = getScaleAdjustedNoteLetter(newSelectedKey, chordNote.noteLetter)

      chordPiano.selectedChord.noteLetter = chordNote.noteLetter
      chordPiano.selectedChord.octave = chordNote.octave

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
    }
  }
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
    const octave = chordPiano.selectedChord.octave ?? 0

    // if we ascended an octave, descend if possible
    if (keyChangeDiffSteps > 0) {
      if (octave > 0) chordPiano.selectedChord.octave = octave - 1
    } else {
      // ascend for descending chords if possible
      if (octave < PIANO_OCTAVES - 1) chordPiano.selectedChord.octave = octave + 1
    }
  }

  return chordPiano
}

function getLowestAbsoluteNoteFromSelectedChord(selectedChord: SelectedChord, transposing: boolean): number {
  const originalChordNotes = getChordNotes(selectedChord, !transposing)
  return (originalChordNotes.notes[0] ?? 0) + originalChordNotes.octave * 12
}