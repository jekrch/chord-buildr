import { getNoteLetter } from "./noteManager"
import * as Note from "@tonaljs/note";
import * as Scale from "tonal-scale"
import { getTransposedNote } from "./transposer"
import { SelectedChord, SelectedKey } from "./chordPianoHandler";

// mapping of chord types to their interval patterns
export const chordMap: Record<string, number[]> = {
  "": [0, 4, 7],
  m: [0, 3, 7],
  m6: [0, 3, 7, 9],
  m7: [0, 3, 7, 10],
  m9: [0, 3, 7, 10, 14],
  maj7: [0, 4, 7, 11],
  maj9: [0, 4, 7, 11, 14],
  maj13: [0, 4, 7, 11, 14, 21],
  6: [0, 4, 7, 9],
  5: [0, 7],
  7: [0, 4, 7, 10],
  9: [0, 4, 7, 10, 14],
  11: [0, 4, 7, 10, 14, 17],
  13: [0, 4, 7, 10, 14, 17, 21],
  "6/9": [0, 4, 7, 9, 14],
  dim: [0, 3, 6],
  dim7: [0, 3, 6, 9],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  aug: [0, 4, 8],
  add9: [0, 4, 7, 14],
  add2: [0, 2, 4, 7],
  mM7: [0, 3, 7, 11],
  m11: [0, 3, 7, 10, 14, 17],
  m13: [0, 3, 7, 10, 14, 17, 21],
  "7sus4": [0, 5, 7, 10],
  "7b9": [0, 4, 7, 10, 13],
  "7#5": [0, 4, 8, 10],
  "7b5": [0, 4, 6, 10],
  "7#11": [0, 4, 7, 10, 18],
  "m7#9": [0, 3, 7, 10, 15],
  m7b9: [0, 3, 7, 10, 13],
  "m7#5": [0, 3, 8, 10],
  m7b5: [0, 3, 6, 10],
  "m7#11": [0, 3, 7, 10, 18],
  "9sus4": [0, 5, 7, 10, 14],
  "+": [0, 4, 8],
  x: [0]
};


export const isValidChordType = (type: string): boolean => {
  return chordMap[type] !== undefined
}

// returns the note numbers for the specified chord (1, 5, 8)
export function getNoteNumberChord(rootNoteNumber: number, chordType: string): number[] {
  const intervalList = chordMap[chordType]
  const chordNoteNumbers: number[] = []

  for (let i = 0; i < intervalList.length; i++) {
    const noteNumber = rootNoteNumber + intervalList[i]
    chordNoteNumbers.push(noteNumber)
  }

  return chordNoteNumbers
}

// returns the note letters for the specified chord (e.g. C, E, G)
export function getNoteLettersChord(key: SelectedKey, rootNoteNumber: number, chordType: string): string[] {
  return getNoteLettersChordByKey(key.noteLetter, rootNoteNumber, chordType);
}

export function getNoteLettersChordByKey(
  keyLetter: string, 
  rootNoteNumber: number, 
  chordType: string
): string[] {
  const intervalList = chordMap[chordType]
  const chordNoteLetters: string[] = []

  for (let i = 0; i < intervalList.length; i++) {
    const noteNumber = rootNoteNumber + intervalList[i]
    const noteLetter = getNoteLetter(keyLetter, noteNumber)

    chordNoteLetters.push(noteLetter)
  }

  return chordNoteLetters
}

export function isMinorType(type: string | undefined): boolean {
  return (
    type?.startsWith('m') && 
    !type?.includes('maj')
  ) ?? false;
}

/**
 * Get the key letter for the provided chord. If the chord is minor, convert it to 
 * the relative major
 * 
 * @param chord - The key object containing type and note letter
 * @param keyLetter - The letter of the key
 */
export function getMajorKeyLetter(chord: SelectedChord): string {
  if (isMinorType(chord.type)) {
    return getTransposedNote(chord.noteLetter, 3)
  } else {
    return chord.noteLetter!
  }
}

/**
 * Returns the proper notation for the noteLetter in the provided chord.
 * e.g. if the chord is F major and the noteLetter is A#, the noteLetter 
 * will be converter to Bb
 * 
 * @param chord - The key object containing type and note letter
 * @param noteLetter - The note letter to adjust
 */
export function getScaleAdjustedNoteLetter(chord: SelectedChord | null | undefined, noteLetter: string): string {
  if (!chord) {
    return noteLetter
  }

  const scale = isMinorType(chord.type) ? 'minor' : 'major'
  const notes = Scale.notes(chord.noteLetter!, scale)

  for (const note of notes) {
    if (equalChroma(note, noteLetter)) {
      noteLetter = note
      break
    }
  }
  return noteLetter
}

/**
 * Returns whether the noteLetter is in the provided key
 * 
 * @param key - The key object containing type and note letter
 * @param noteLetter - The note letter to check
 */
export function noteIsInScale(key: SelectedChord | null, noteLetter: string): boolean {
  if (!key) {
    return false
  }

  const scale = isMinorType(key.type) ? 'minor' : 'major'
  const notes = Scale.notes(key.noteLetter!, scale)

  for (const note of notes) {
    if (equalChroma(note, noteLetter)) {
      return true
    }
  }
  return false
}

export function equalChroma(noteLetter1: string, noteLetter2: string): boolean {
  return Note.chroma(noteLetter1) === Note.chroma(noteLetter2)
}
