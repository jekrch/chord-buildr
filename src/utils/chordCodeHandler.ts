import { isValidChordType, getScaleAdjustedNoteLetter } from "./chordManager"
import { ChordPiano, createChordPiano, SelectedChord } from "./chordPianoHandler"
import { SYNTH_TYPES } from "./synthLibrary"
import {
  isValidLetter, 
  getNoteNumber,
  noteLetterMapWithSharps,
  noteLetterMapWithFlats
} from "../utils/noteManager"
import { AppState } from "../components/context/AppContext"
import { UX_FORMAT_OPTIONS } from "../components/Layout/ConfigModal"
import { DEFAULT_EQ, EQSettings, hasFlatEq } from "./synthPlayer"

interface SynthSettings {
  volume: number;
  type: string;
  format: string;
  eq: EQSettings;
}

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

export 
function getChordFromCode(chordCode: string): SelectedChord | undefined {
  let chord: SelectedChord = {}

  try {
    chordCode = chordCode.replace("(", "");

    // this might show up in the progression code due to facebook url processing
    // it should be ignored
    if (chordCode.includes("&amp")) return

    if (chordCode.includes("&fbclid")) {
      chordCode = removeFbclid(chordCode)
    }

    chordCode = chordCode.split("#piano-")[0]

    chord.octave = extractOctave(chordCode);

    chordCode = chordCode.replace(")", "")

    // extract position if present
    const positionMatch = chordCode.match(/\.(\d+)$/)
    
    if (positionMatch) {
      chord.position = parseInt(positionMatch[1]) - 1;
      chordCode = chordCode.replace(/\.\d+$/, '')
    }

    //console.log(positionMatch)

    chord.isKey = chordCode.includes("*")
    chordCode = chordCode.replace("*", "")

    chordCode = processSlashChord(chordCode, chord)

    let indexOfType = getIndexOfType(chordCode);

    chord.noteLetter = capitalizeFirstLetter(
      chordCode.substring(1, indexOfType)
    )
    chord.type = chordCode.substring(indexOfType)
  } catch (ex) {
    logChordAnalysisException(ex, chordCode);
    return
  }

  if (!(isValidChordType(chord.type as string) && isValidLetter(chord.noteLetter as string))) {
    logInvalidChordCodeError(chordCode, chord as SelectedChord);
    return
  }

  return chord as SelectedChord
}


function logChordAnalysisException(ex: unknown, chordCode: string): void {
  console.log(ex);
  console.log("Exception - invalid chord code: " + chordCode);
}

function logInvalidChordCodeError(chordCode: string, chord: SelectedChord): void {
  console.log(
    "Invalid chord code: " +
    chordCode +
    "; letter: " +
    chord.noteLetter +
    "; type: " +
    chord.type
  );
}

/**
 * Return the index within a chordCode at which the chord type begins 
 * e.g. 0C#m -> 3; 2D -> 3; 3F##maj7 -> 4
 * @param chordCode 
 * @returns 
 */
function getIndexOfType(chordCode: string): number {
  let startIndex = isNumeric(chordCode[0]) ? 2 : 1;
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
  let fbCode = chordCode.substring(startIndex, startIndex + 69)
  chordCode = chordCode.replace(fbCode, "")
  console.log("fbCode removed: " + fbCode)
  return chordCode
}

function processSlashChord(chordCode: string, chord: SelectedChord): string {
  if (chordCode.includes(":")) {
    var slashNote = chordCode.split(":").pop() as string

    chord.slashNote = slashNote
    chord.slash = true

    chordCode = chordCode.replace(":" + slashNote, "")
  }
  return chordCode
}

export const getChordDisplay = (chord: SelectedChord): string => {
  return `${chord.noteLetter}${chord.type}${
    isSlashChord(chord) ? `/${chord.slashNote}` : ""
  }`
}

/**
 * Builds a space separated string of progression contained in the provided
 * chordPianoSet
 * 
 * @param chordPianoSet 
 * @returns 
 */
export function getProgressionString(chordPianoSet: ChordPiano[]): string {
  let code = '';

  if (!chordPianoSet) return code;
  
  for (let i = 0; i < chordPianoSet.length; i++) {
    let chordPiano = chordPianoSet[i]
    let selectedChord = chordPiano.selectedChord

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
  }

  return code;
}

export function isSlashChord(selectedChord: SelectedChord): boolean {
  return (
    selectedChord.slash === true &&
    selectedChord.slashNote !== undefined &&
    selectedChord.slashNote !== ""
  )
}

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

/***
 * If the chordPiano is set to show flats and the provided letter is sharp,
 * find the corresponding flat letter. Likewise, if the chordPiano is
 * set to show sharps
 */
export function updateFlatOrSharpLetter(showFlats: boolean | undefined, noteLetter: string): string {
  var noteNumber = getNoteNumber(noteLetter)

  if (showFlats) {
    if (noteLetter?.includes("#")) {
      return noteLetterMapWithFlats[noteNumber!] ?? noteLetter
    }
  } else if (noteLetter?.includes("b")) {
    return noteLetterMapWithSharps[noteNumber!] ?? noteLetter
  }

  return noteLetter
}

function isValidType(type: string): boolean {
  return Object.keys(SYNTH_TYPES).includes(type)
}

function isValidFormat(type: string): boolean {
  return Object.keys(UX_FORMAT_OPTIONS).includes(type)
}

function isValidVol(volume: number): boolean {
  return !isNaN(volume) && volume >= 0 && volume <= 100
}

export function getChordPianoSetFromProgCode(progCode: string | null): ChordPiano[] {
  if (progCode == null) return []

  var chordArray = progCode.split(")")

  var chordPianoSet: ChordPiano[] = []

  var progKeySet = false

  for (let i = 0; i < chordArray.length; i++) {
    var chordCode = chordArray[i]

    if (chordCode === "") continue

    var chordPiano = createChordPiano(i, chordCode)

    if (!chordPiano) continue

    progKeySet = validateProgKey(chordPiano, progKeySet)

    chordPianoSet.push(chordPiano)
  }

  return chordPianoSet
}

function validateProgKey(chordPiano: ChordPiano, progKeySet: boolean): boolean {
  // if the prog key is set here, only accept it
  // if we haven't already set the progKey

  if (chordPiano.isProgKey) {
    if (progKeySet) chordPiano.isProgKey = false
    else progKeySet = true
  }
  return progKeySet
}


/**
 * Builds a progression from a provided code
 * @param state 
 * @param code 
 * @returns 
 */
export function buildProgFromCode(state: AppState, code: string): AppState {
  if (state.building) {
    return state
  }

  try {
    // handle percent-encoded strings
    const decodedCode = code.includes("%") ? decodeURIComponent(code) : code

    // create a url-like string to use URLSearchParams
    const searchParams = new URLSearchParams(decodedCode.startsWith("?") ? decodedCode : `?${decodedCode}`)

    // get progression code - check both 'prog' and 'p' params
    const progCode = searchParams.get("prog") || searchParams.get("p")
    const synthSettings = parseSynthCode(searchParams.get("s"))

    // update state with new values
    state.format = synthSettings.format
    state.synth = synthSettings.type
    state.volume = synthSettings.volume
    state.eq = synthSettings.eq

    state.chordPianoSet = getChordPianoSetFromProgCode(progCode)
    state.building = false

    updateUrlProgressionCode(state)
    
    return state
  } catch (error) {
    console.error("error parsing progression code:", error)
    return {
      ...state,
      building: false
    }
  }
}

/**
 * parses synth settings from url parameter
 * expected format: "type:volume:format:eq" (e.g. "p:90:p:0-10-0")
 */
export function parseSynthCode(synthCode: string | null): SynthSettings {
  
  // default synth values
  let defaultSettings: SynthSettings = {
    volume: 80,
    type: "p",
    format: "p",
    eq: DEFAULT_EQ
  }

  if (!synthCode) {
    return defaultSettings
  }

  const [type, volumeStr, format, eq] = synthCode.split(":")
  const volume = parseInt(volumeStr)
  
  let eqSettings: EQSettings = DEFAULT_EQ;

  if (eq) {
    const [low, mid, high] = eq.split(".");

    eqSettings.low = parseInt(low);
    eqSettings.mid = parseInt(mid);
    eqSettings.high = parseInt(high);
  }

  return {
    type: isValidType(type) ? type : defaultSettings.type,
    volume: isValidVol(volume) ? volume : defaultSettings.volume,
    format: isValidFormat(format) ? format : defaultSettings.format,
    eq: eqSettings
  }
}

/**
 * creates a url query string from the current state without escaping characters
 */
export function getStateParamsCode(state: AppState): string {

  let synthCode = getSynthCode(state)

  // build progression code
  let progCode = getProgressionCode(state)

  if (synthCode?.length) {
    synthCode = `s=${synthCode}`
  }

  if (progCode?.length) {
    progCode = `p=${progCode}`
  }

  // manually construct the query string
  return `${synthCode}&${progCode}`
}

/**
 * Generates a progression code from the current state
 * 
 * @param state 
 * @returns 
 */
function getProgressionCode(state: AppState) {
  let progCode = ""

  const selectedKeyChord = state.chordPianoSet?.find(c => c.isProgKey)?.selectedChord

  // if there is a prog key, add it to the start of the progression
  if (state.chordPianoSet?.length) {
    progCode = state.chordPianoSet
      .map(piano => {
        const chord = piano.selectedChord
        if (!chord) return ""

        const chordLetter = getScaleAdjustedNoteLetter(selectedKeyChord, chord.noteLetter!)

        let chordCode = `${chord.octave}${chordLetter}${chord.type}`

        if (piano.isProgKey) chordCode += "*"

        if (isSlashChord(chord)) {
          const adjustedSlashNote = getScaleAdjustedNoteLetter(
            selectedKeyChord,
            updateFlatOrSharpLetter(piano.showFlats || false, chord.slashNote as string)
          )
          chordCode += `:${adjustedSlashNote}`
        }

        if (chord.position) {
          chordCode += `.${chord.position + 1}`
        }

        return `(${chordCode})`
      })
      .join("")
  }

  return progCode
}

/**
 * Generates a synth code from the current state
 * @param state 
 * @returns 
 */
function getSynthCode(state: AppState) {
  let synthCode = `${state.synth}:${state.volume}:${state.format}`

  // if the eq is not the default, add it to the synth code
  if (!hasFlatEq(state.eq)) {
    synthCode += `:${state.eq.low}.${state.eq.mid}.${state.eq.high}`
  }
  return synthCode
}

export function updateUrlProgressionCode(state: AppState): void {
  if (state.building) {
    return
  }
  
  let progressionCode = getStateParamsCode(state)

  loadProgressionCode(state, progressionCode)
}

function loadProgressionCode(state: AppState, progressionCode: string): void {
  
  if (progressionCode === state.currentProgCode)
    return;


  if (state.building) {
    state.currentProgCode = progressionCode;
    return;
  }

  if (state.currentProgCode) { 
    const prevCodeLength = state.previousProgCodes.length;

    // Only add to history if it's different from the current code
    if (prevCodeLength <= 1) {
      state.previousProgCodes.push(state.currentProgCode);
    } else if (
      state.previousProgCodes[prevCodeLength - 1] !== state.currentProgCode
    ) {
      state.previousProgCodes.push(state.currentProgCode);
    }
  } 
  
  state.currentProgCode = progressionCode;
}

export function convertProgressionStrToCode(submittedProgressionStr: string): string {
  let newProgressionString = ""

  submittedProgressionStr = submittedProgressionStr
    .replace(',', ' ')
    .trim()
    .replace(/\s\s+/g, ' ') // convert multiple spaces to one

  for (let chordStr of submittedProgressionStr.split(' ')) {
    let chordCode = convertChordStrToCode(chordStr)
    newProgressionString += `(${chordCode})`
  }

  return newProgressionString;
}

export function convertChordStrToCode(chordStr: string): string {
  let octave = getOctave(chordStr)

  // extract position if present
  let position = ''
  const positionMatch = chordStr.match(/\.(\d+)$/)
  if (positionMatch) {
    position = `.${parseInt(positionMatch[1])}`
    chordStr = chordStr.replace(/\.\d+$/, '')
  }

  let chord = chordStr.replace(/(^\d+)(.+$)/i, '$2')
  let letter = getLetter(chord)

  let { type, slash } = getTypeAndSlash(chord, letter)

  return `${octave}${letter}${type}${slash}${position}`;
}

function getTypeAndSlash(chord: string, letter: string): { type: string; slash: string } {
  let type = chord.replace(letter, '').toLowerCase();
  let slash = '';

  try {
    if (type.includes('/') && !type.endsWith('6/9')) {
      var lastSlashPos = type.lastIndexOf('/');
      slash = type.substring(lastSlashPos + 1);
      slash = ':' + upperCaseFirst(slash);
      type = type
      .substring(0, lastSlashPos);
    }
  } catch (err) {
    console.log('Error while extracting slash');
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
  } catch(err) {
    console.log('Error while extracting type');
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
  } catch(ex) {
    console.log("Error while extracting letter");
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
  } catch(err) {
    console.log('Error while extracting octave');
  }
  return octave
}

function upperCaseFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.substring(1);
}