  // @ts-ignore
import { isValidChordType, getScaleAdjustedNoteLetter } from "./chordManager"
import { ChordPiano, createChordPiano, SelectedChord } from "./chordPianoHandler"
  // @ts-ignore
import { synthTypes } from "./synthLibrary"
  // @ts-ignore
import { isValidLetter, getNoteNumber } from "./noteManager"
import {
  noteLetterMapWithSharps,
  noteLetterMapWithFlats
    // @ts-ignore
} from "../utils/noteManager"
import { AppState } from "../components/context/AppContext"

interface SynthSettings {
  volume: number;
  type: string;
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

export function getChordFromCode(chordCode: string): SelectedChord | undefined {
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

    chord.isKey = chordCode.includes("*")
    chordCode = chordCode.replace("*", "")

    chordCode = processSlashChord(chordCode, chord)

    var indexOfType = getIndexOfType(chordCode);

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
  var startIndex = chordCode.indexOf("&fbclid")
  var fbCode = chordCode.substring(startIndex, startIndex + 69)
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

export function getProgressionCode(state: AppState): string {
  var synthCode = "?s=" + state.synth + ":" + state.volume

  var code = ""

  let keyChord = state.chordPianoSet?.find(c => c.isProgKey)?.selectedChord!;

  if (state.chordPianoSet?.length) {
    for (let i = 0; i < state.chordPianoSet.length; i++) {
      var chordPiano = state.chordPianoSet[i]
      var selectedChord = chordPiano.selectedChord

      if (!selectedChord) continue

      let chordLetter = getScaleAdjustedNoteLetter(keyChord, selectedChord.noteLetter!);

      var chordCode =
        selectedChord.octave + chordLetter + selectedChord.type

      if (chordPiano.isProgKey) chordCode += "*"

      if (isSlashChord(selectedChord)) {
        selectedChord.slashNote = updateFlatOrSharpLetter(
          chordPiano.showFlats || false,
          selectedChord.slashNote as string
        )
        selectedChord.slashNote = getScaleAdjustedNoteLetter(keyChord, selectedChord.slashNote);
        chordCode += ":" + selectedChord.slashNote
      }

      code += `(${chordCode})`
    }
  }

  return synthCode + "&p=" + code
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

    let octave =  undefined;

    if (selectedChord.octave !== 1) {
      octave = selectedChord.octave;
    }

    code += `${octave ?? ''}${chordCode} `
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
export function updateFlatOrSharpLetter(showFlats: boolean, noteLetter: string): string {
  var noteNumber = getNoteNumber(noteLetter)

  if (showFlats) {
    if (noteLetter.includes("#")) {
      return noteLetterMapWithFlats[noteNumber] ?? noteLetter
    }
  } else if (noteLetter.includes("b")) {
    return noteLetterMapWithSharps[noteNumber] ?? noteLetter
  }

  return noteLetter
}

/**
 * get a synth settings obj from url code (e.g. pl:100)
 * @param synthCode
 * @returns
 */
export function getSynthCode(synthCode: string | null): SynthSettings {
  // init with default synth values
  var synth: SynthSettings = {
    volume: 90,
    type: "p"
  }

  if (synthCode != null) {
    if (hasSynthCode(synthCode)) {
      return synth
    }

    var codeSplit = synthCode.split(":")

    var type = codeSplit[0]
    var volume = parseInt(codeSplit[1])

    if (isValidType(type)) {
      synth.type = type
    }

    if (isValidVol(volume)) {
      synth.volume = volume
    }
  }

  return synth
}

function hasSynthCode(synthCode: string): boolean {
  return synthCode.split(":").length !== 2
}

function isValidType(type: string): boolean {
  return Object.keys(synthTypes).includes(type)
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

export function buildProgFromCode(state: AppState, code: string): AppState {
  if (state.building) {
    return state
  }

  if (code.includes("%")) {
    code = decodeURIComponent(code)
  }

  var params = getQueryStringParams(code)

  var progCode = params.prog != null ? params.prog : params.p
  var synthSettings = getSynthCode(params.s)

  state.synth = synthSettings.type
  state.volume = synthSettings.volume
  state.chordPianoSet = getChordPianoSetFromProgCode(progCode)
  state.building = false

  updateUrlProgressionCode(state)

  return state
}

interface QueryParams {
  [key: string]: string;
}

export function getQueryStringParams(query: string): QueryParams {
  return query
    ? (/^[?]/.test(query) ? query.slice(1) : query)
        .split("&")
        .reduce((params: QueryParams, param) => {
          let [key, value] = param.split("=")
          params[key] = value
            ? decodeURIComponent(value.replace(/\+/g, " "))
            : ""
          return params
        }, {})
    : {}
}

export function updateUrlProgressionCode(state: AppState): void {
  if (state.building) {
    return
  }
  
  var progressionCode = getProgressionCode(state)

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

function convertChordStrToCode(chordStr: string): string {
  let octave = getOctave(chordStr)

  let chord = chordStr.replace(/(^\d+)(.+$)/i, '$2')
  let letter = getLetter(chord)

  let { type, slash } = getTypeAndSlash(chord, letter)

  return `${octave}${letter}${type}${slash}`;
}

function getTypeAndSlash(chord: string, letter: string): { type: string; slash: string } {
  let type = chord.replace(letter, '').toLowerCase();
  let slash = '';

  try {
    if (type.includes('/') && !type.endsWith('6/9')) {
      var lastSlashPos = type.lastIndexOf('/');
      slash = type.substring(lastSlashPos + 1);
      slash = ':' + upperCaseFirst(slash);
      type = type.substring(0, lastSlashPos);
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