import { getNoteLetter } from "./noteManager"
import * as Note from "@tonaljs/note";
import * as Scale from "tonal-scale"
import { getTransposedNote } from "./transposer"

export const chordMap = {
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
}

export const isValidChordType = (type) => {
  return chordMap[type] !== undefined
}

// returns the note numbers for the specified chord (1, 5, 8)
export function getNoteNumberChord(rootNoteNumber, chordType) {
  var intervalList = chordMap[chordType]
  var chordNoteNumbers = []

  for (var i = 0; i < intervalList.length; i++) {
    var noteNumber = rootNoteNumber + intervalList[i]
    chordNoteNumbers.push(noteNumber)
  }

  return chordNoteNumbers
}

// returns the note letters for the specified chord (e.g. C, E, G)
export function getNoteLettersChord(key, rootNoteNumber, chordType) {
  var intervalList = chordMap[chordType]
  var chordNoteLetters = []

  for (var i = 0; i < intervalList.length; i++) {
    var noteNumber = rootNoteNumber + intervalList[i]
    var noteLetter = getNoteLetter(key, noteNumber)

    chordNoteLetters.push(noteLetter)
  }

  return chordNoteLetters
}

export function isMinorType(type) {
  return type?.startsWith('m') && !type?.includes('maj') 
}

/**
 * Get the key letter for the provided key. If the key is minor, convert it to 
 * the relative major
 * 
 * @param {*} key 
 * @param {*} keyLetter 
 * @returns 
 */
export function getMajorKeyLetter(key, keyLetter) {
  if (isMinorType(key.type)) {
    keyLetter = getTransposedNote(key.noteLetter, 3);

  } else {
    keyLetter = key.noteLetter;
  }
  return keyLetter;
}

export function getScaleAdjustedChordLetter(key, chordLetter) {
  
  if (!key) {
    return chordLetter;
  }

  let scale = isMinorType(key.type) ? 'minor' : 'major';

  let notes = Scale.notes(key.noteLetter, scale);

  for (let note of notes) {
    if (equalChroma(note, chordLetter)) {
      chordLetter = note;
      break;
    }
  }
  return chordLetter;
}

export function equalChroma(noteLetter1, noteLetter2) {
  return Note.chroma(noteLetter1) === Note.chroma(noteLetter2);
}
