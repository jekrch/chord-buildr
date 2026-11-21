import { isValidChordType } from "../utils/chordManager"
import { isSlashChord } from "./chord"
import { CodableChord, SECTION_BREAK_CODE } from "./progression"
import { debug } from "../utils/debug"

/**
 * the progression as typed in the text editor, e.g. "C G/B / Am7 2F.3":
 * chords separated by spaces or commas, an optional octave before a
 * chord, an optional fretted position after a dot, and a lone / or | for a
 * section break
 */

// how a section break is written in the text editor
const SECTION_BREAK_TEXT = "/"

function isSectionBreakText(token: string): boolean {
  return /^[/|]+$/.test(token)
}

/**
 * Builds a space separated string of progression contained in the provided
 * chordPianoSet
 */
export function getProgressionString(chordPianoSet: CodableChord[]): string {
  let code = '';

  if (!chordPianoSet) return code;
  
  for (const chordPiano of chordPianoSet) {
    const selectedChord = chordPiano.selectedChord

    if (!selectedChord) continue

    let chordCode =
      (selectedChord.noteLetter ?? '') + 
      (selectedChord.type ?? '');

    if (isSlashChord(selectedChord)) {
      chordCode += "/" + selectedChord.slashNote
    }

    let octave = undefined;

    if (selectedChord.octave !== 1) {
      octave = selectedChord.octave;
    }

    // add position if present
    const positionSuffix = selectedChord.position !== undefined ? `.${selectedChord.position + 1}` : ''
    
    code += `${octave ?? ''}${chordCode}${positionSuffix} `

    if (chordPiano.breakAfter !== undefined) {
      code += `${SECTION_BREAK_TEXT} `
    }
  }

  return code;
}

export function convertProgressionStrToCode(submittedProgressionStr: string): string {
  let newProgressionString = ""

  submittedProgressionStr = submittedProgressionStr
    .replace(/,/g, ' ')
    .trim()
    .replace(/\s\s+/g, ' ') // convert multiple spaces to one

  for (const chordStr of submittedProgressionStr.split(' ')) {
    if (isSectionBreakText(chordStr)) {
      newProgressionString += `(${SECTION_BREAK_CODE})`
      continue
    }

    const chordCode = convertChordStrToCode(chordStr)
    newProgressionString += `(${chordCode})`
  }

  return newProgressionString;
}

export function convertChordStrToCode(chordStr: string): string {
  const octave = getOctave(chordStr)

  // extract position if present
  let position = ''
  const positionMatch = chordStr.match(/\.(\d+)$/)
  if (positionMatch?.[1]) {
    position = `.${parseInt(positionMatch[1])}`
    chordStr = chordStr.replace(/\.\d+$/, '')
  }

  const chord = chordStr.replace(/(^\d+)(.+$)/i, '$2')
  const letter = getLetter(chord)

  const { type, slash } = getTypeAndSlash(chord, letter)

  return `${octave}${letter}${type}${slash}${position}`;
}

function getTypeAndSlash(chord: string, letter: string): { type: string; slash: string } {
  let type = chord.replace(letter, '').toLowerCase();
  let slash = '';

  try {
    if (type.includes('/') && !type.endsWith('6/9')) {
      const lastSlashPos = type.lastIndexOf('/');
      slash = type.substring(lastSlashPos + 1);
      slash = ':' + upperCaseFirst(slash);
      type = type
      .substring(0, lastSlashPos);
    }
  } catch {
    debug('could not extract slash');
    slash = '';
  }

  type = sanitizeType(type);

  return { type, slash }
}

/**
 * If the chord type is valid, return it, otherwise, try to find the nearest equivalent
 * 
 * @param type 
 * @returns 
 */
function sanitizeType(type: string): string {
  try {
    // initial equivalent replacement
    type = type.replace('minor', 'm')
            .replace('diminished', 'dim')
            .replace('major7', 'maj7')
            .replace('major', '');

    let newType = '';

    if (isValidChordType(type)) {
      return type; 

    } else {
      if (type.startsWith('m')) {
        newType += 'm'
      } else if (type.includes('dim')) {
        newType += 'dim'
      }

      if (!newType.includes('dim')) {
        if (type.includes('7')) {
          newType += '7'
        } else if (type.includes('6')) {
          newType += '6'
        } else if (type.includes('9')) {
          newType += '9'
        }
      }
      // if we didn't get a valid type, return x
      if (!newType?.length) {
        newType = 'x'
      }
      return newType;  
    }
  } catch {
    debug('could not extract type');
    return 'x';
  }
}

function getLetter(chord: string | undefined): string {
  try {
    let letter = chord?.[0] || ''
    let accidentals = getAccidentalAtIndex(chord, 1);
    if (accidentals.length) {
      accidentals += getAccidentalAtIndex(chord, 2);
      letter += accidentals;
    }
    return letter;
  } catch {
    debug('could not extract letter');
    return 'C';
  }
}

function getAccidentalAtIndex(chord: string | undefined, index: number): string {
  if (chord?.[index] === '#' || chord?.[index]?.toLowerCase() === 'b') {
    return chord[index].toLowerCase()
  }
  return '';
}

function getOctave(chordStr: string): string {
  let octave = '1'
  try {
    if (chordStr.match(/^\d/)) {
      octave = chordStr.replace(/(^\d+)(.+$)/i, '$1')
      if (Number(octave) > 2) {
        octave = '2'
      } else if (Number(octave) < 0) {
        octave = '0'
      }
    }
  } catch {
    debug('could not extract octave');
  }
  return octave
}

function upperCaseFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.substring(1);
}