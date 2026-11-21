import { isValidChordType } from "../utils/chordManager"
import { isValidLetter } from "../utils/noteManager"
import type { SelectedChord } from "../utils/chordPianoHandler"
import { debug } from "../utils/debug"

/**
 * one chord's code in the url, e.g. 1C#m7*:E.2 — the octave, root, type,
 * a * when it's the progression's key, the slash note after a :, and the
 * picked fretted position (1-based) after a .
 */

/***
 * get the octave from the start of the code
 */
export function extractOctave(chordCode: string): number {
  const octave = chordCode.substring(0, 1);

  if (!octave || isNaN(Number(octave)) || Number(octave) < 0) {
    return 0
  } else if (Number(octave) > 2) {
    return 2
  }

  return Number(octave);
}

/**
 * reads one chord's code. returns undefined for a code that isn't a valid
 * chord, which the progression then skips
 */
export function parseChordCode(chordCode: string): SelectedChord | undefined {
  // filled in as the code is read, and checked at the end
  const chord: Partial<SelectedChord> = {}

  try {
    chordCode = chordCode.replace("(", "");

    // this might show up in the progression code due to facebook url processing
    // it should be ignored
    if (chordCode.includes("&amp")) return

    if (chordCode.includes("&fbclid")) {
      chordCode = removeFbclid(chordCode)
    }

    chordCode = chordCode.split("#piano-")[0] ?? ""

    chord.octave = extractOctave(chordCode);

    chordCode = chordCode.replace(")", "")

    // extract position if present
    const positionMatch = chordCode.match(/\.(\d+)$/)

    if (positionMatch?.[1]) {
      chord.position = parseInt(positionMatch[1]) - 1;
      chordCode = chordCode.replace(/\.\d+$/, '')
    }

    chord.isKey = chordCode.includes("*")
    chordCode = chordCode.replace("*", "")

    chordCode = processSlashChord(chordCode, chord)

    const indexOfType = getIndexOfType(chordCode);

    chord.noteLetter = capitalizeFirstLetter(
      chordCode.substring(1, indexOfType)
    )
    chord.type = chordCode.substring(indexOfType)
  } catch (ex) {
    debug("invalid chord code: " + chordCode, ex)
    return
  }

  const { noteLetter, type, octave } = chord
  if (
    noteLetter === undefined || type === undefined || octave === undefined ||
    !(isValidChordType(type) && isValidLetter(noteLetter))
  ) {
    debug(
      "invalid chord code: " + chordCode +
      "; letter: " + noteLetter +
      "; type: " + type
    );
    return
  }

  return { ...chord, noteLetter, type, octave }
}

/**
 * Return the index within a chordCode at which the chord type begins
 * e.g. 0C#m -> 3; 2D -> 3; 3F##maj7 -> 4
 */
function getIndexOfType(chordCode: string): number {
  const startIndex = isNumeric(chordCode[0] ?? "") ? 2 : 1;
  for (let i = startIndex; i < chordCode.length; i++) {
    if (chordCode[i] !== '#' && chordCode[i] !== 'b') {
      return i;
    }
  }
  return chordCode.length;
}

function isNumeric(value: string): boolean {
  return /^-?\d+$/.test(value);
}

/***
 * if an fbclid was inserted into the code, remove it here
 */
function removeFbclid(chordCode: string): string {
  const startIndex = chordCode.indexOf("&fbclid")
  const fbCode = chordCode.substring(startIndex, startIndex + 69)
  chordCode = chordCode.replace(fbCode, "")
  debug("fbclid removed: " + fbCode)
  return chordCode
}

function processSlashChord(chordCode: string, chord: Partial<SelectedChord>): string {
  if (chordCode.includes(":")) {
    const slashNote = chordCode.split(":").pop() as string

    chord.slashNote = slashNote
    chord.slash = true

    chordCode = chordCode.replace(":" + slashNote, "")
  }
  return chordCode
}

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function isSlashChord(selectedChord: SelectedChord): boolean {
  return (
    selectedChord.slash === true &&
    selectedChord.slashNote !== undefined &&
    selectedChord.slashNote !== ""
  )
}

// the chord's name as shown to people, e.g. C#m7/E
export const getChordDisplay = (chord: SelectedChord): string => {
  return `${chord.noteLetter}${chord.type}${
    isSlashChord(chord) ? `/${chord.slashNote}` : ""
  }`
}
