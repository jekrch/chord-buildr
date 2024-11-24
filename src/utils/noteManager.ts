
// defines valid note letters and their corresponding numbers
type NoteLetter = string;
type NoteNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
type NoteMap = Record<number, NoteLetter>;
type ExtendedNoteMap = Record<NoteLetter, number>;

export const noteLetterMapWithSharps: NoteMap = {
  1: "C",
  2: "C#",
  3: "D",
  4: "D#",
  5: "E",
  6: "F",
  7: "F#",
  8: "G",
  9: "G#",
  10: "A",
  11: "A#",
  12: "B"
};

export const noteLetterMapWithFlats: NoteMap = {
  1: "C",
  2: "Db",
  3: "D",
  4: "Eb",
  5: "E",
  6: "F",
  7: "Gb",
  8: "G",
  9: "Ab",
  10: "A",
  11: "Bb",
  12: "B"
};

export const extendedNoteNumberMap: ExtendedNoteMap = {
  C: 1,
  "C#": 2,
  Db: 2,
  D: 3,
  "D#": 4,
  Eb: 4,
  E: 5,
  "E#": 6,
  F: 6,
  "F#": 7,
  Gb: 7,
  G: 8,
  "G#": 9,
  Ab: 9,
  A: 10,
  "A#": 11,
  Bb: 11,
  B: 12,
  "B#": 1,
  Cb: 12,
  "C##": 3,
  "Dbb": 1,
  "D##": 5,
  "Ebb": 3,
  "E##": 7,
  "Fb": 5,
  "F##": 8,
  "Gbb": 6,
  "G##": 10,
  "Abb": 8,
  "A##": 12,
  "Bbb": 10,
};

// includes both sharps and flats
export const noteNumberMap: ExtendedNoteMap = {
  C: 1,
  "C#": 2,
  Db: 2,
  D: 3,
  "D#": 4,
  Eb: 4,
  E: 5,
  F: 6,
  "F#": 7,
  Gb: 7,
  G: 8,
  "G#": 9,
  Ab: 9,
  A: 10,
  "A#": 11,
  Bb: 11,
  B: 12
};

export const isValidLetter = (letter: NoteLetter): boolean => {
  return Object.keys(extendedNoteNumberMap).includes(letter);
};

export function getSharpEquivalent(letter: NoteLetter): NoteLetter {
  const noteNumber = extendedNoteNumberMap[letter];
  return noteLetterMapWithSharps[noteNumber];
}

export function getFlatEquivalent(letter: NoteLetter): NoteLetter {
  const noteNumber = extendedNoteNumberMap[letter];
  return noteLetterMapWithFlats[noteNumber];
}

// sharps - c / g / d / a / e / b / f# / c#
// flats  - f / Bb / Eb / Ab / Db / Gb / Cb
export function getNoteLetterMapByKey(key: NoteLetter): NoteMap {
  key = formatNoteName(key);

  switch (key) {
    case "C":
    case "C#":
    case "D":
    case "E":
    case "F#":
    case "G":
    case "A":
    case "B":
      return noteLetterMapWithSharps;

    case "G#":
    case "Ab":
    case "A#":
    case "Bb":
    case "Cb":
    case "Db":
    case "D#":
    case "Eb":
    case "F":
    case "Gb":
      return noteLetterMapWithFlats;

    default:
      return noteLetterMapWithFlats;
  }
}

// converts note letter to the correct case
// (e.g. aB -> Ab; c# -> C#)
export function formatNoteName(letter: NoteLetter): NoteLetter {
  if (!letter) return letter;
  
  const firstChar = letter.charAt(0).toUpperCase();
  const secondChar = letter.charAt(1)?.toLowerCase() ?? '';
  const thirdChar = letter.charAt(2)?.toLowerCase() ?? '';
  
  return `${firstChar}${secondChar}${thirdChar}`.trim();
}

// get the number corresponding to the provided note letter
export function getNoteNumber(letter?: string | null): number | undefined {
  if (!letter) return undefined;

  letter = formatNoteName(letter);
  return extendedNoteNumberMap[letter];
}

// get the letter corresponding to the provided note number
export function getNoteLetter(key: NoteLetter, number: number): NoteLetter {
  const noteIndex = normalizeNoteNumber(number);
  const noteLetterMap = getNoteLetterMapByKey(key);
  const letter = noteLetterMap[noteIndex];
  
  return formatNoteName(letter);
}

export function normalizeNoteNumber(noteNumber: number): NoteNumber {
  while (noteNumber > 12) {
    noteNumber = noteNumber - 12;
  }

  while (noteNumber < 1) {
    noteNumber = noteNumber + 12;
  }

  return noteNumber as NoteNumber;
}

interface NormalizedNote {
  noteNumber: NoteNumber;
  octave: number;
}

/***
 * if the note is over 12, find the corresponding note in the next octave
   or if we're at the highest octave, bring the note down 12
 */
export function normalizeNote(noteNumber: number, octave: number): NormalizedNote {
  while (noteNumber > 12) {
    noteNumber = noteNumber - 12;

    if (octave < 2) {
      octave++;
    }
  }

  while (noteNumber < 1) {
    noteNumber = noteNumber + 12;

    if (octave !== 0) {
      octave--;
    }
  }

  return { noteNumber: noteNumber as NoteNumber, octave };
}