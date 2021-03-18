import { getNoteLetter } from "./noteManager"

export const chordMap = {
  "": [0, 4, 7],
  m: [0, 3, 7],
  m6: [0, 3, 7, 9],
  m7: [0, 3, 7, 10],
  m9: [0, 3, 7, 10, 14],
  maj7: [0, 4, 7, 11],
  6: [0, 4, 7, 9],
  5: [0, 7],
  7: [0, 4, 7, 10],
  9: [0, 4, 7, 10, 14],
  11: [0, 4, 7, 10, 14, 17],
  13: [0, 4, 7, 10, 14, 17, 21],
  "6/9": [0, 4, 7, 9, 14],
  maj9: [0, 4, 7, 11, 14],
  dim: [0, 3, 6],
  dim7: [0, 3, 6, 9],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
  aug: [0, 4, 8],
  add9: [0, 4, 7, 14],
  add2: [0, 2, 4, 7],
  m7b5: [0, 2, 6, 10],
  mM7: [0, 3, 7, 11],
  m11: [0, 3, 7, 10, 14, 17],
  "7sus4": [0, 5, 7, 10],
  "7-9": [0, 4, 7, 10, 13],
  "7#5": [0, 4, 8, 10],
  maj13: [0, 4, 7, 11, 14, 21],
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
