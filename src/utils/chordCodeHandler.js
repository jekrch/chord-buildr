import { isValidChordType, getScaleAdjustedNoteLetter } from "./chordManager"
import { createChordPiano } from "./chordPianoHandler"
import { synthTypes } from "./synthLibrary"
import { isValidLetter, getNoteNumber } from "./noteManager"
import {
  noteLetterMapWithSharps,
  noteLetterMapWithFlats
} from "../utils/noteManager"

/***
 * get the octave from the start of the code
 */
export function extractOctave(chordCode, chord) {
  var octave = chordCode.substring(0, 1)

  if (!octave || isNaN(octave) || Number(octave) < 0) {
    octave = 0
  } else if (Number(octave) > 2) {
    octave = 2
  }

  return octave
}

export function getChordFromCode(chordCode) {
  var chord = {}

  try {
    chordCode = chordCode.replace("(", "");

    // this might show up in the progression code due to facebook url processing
    // it should be ignored
    if (chordCode.includes("&amp")) return

    if (chordCode.includes("&fbclid")) {
      chordCode = removeFbclid(chordCode)
    }

    chordCode = chordCode.split("#piano-")[0]

    chord.octave = extractOctave(chordCode, chord)

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

  if (!(isValidChordType(chord.type) && isValidLetter(chord.noteLetter))) {
    logInvalidChordCodeError(chordCode, chord);
    return
  }

  return chord
} 

function logChordAnalysisException(ex, chordCode) {
  console.log(ex);
  console.log("Exception - invalid chord code: " + chordCode);
}

function logInvalidChordCodeError(chordCode, chord) {
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
 * @param {} chordCode 
 * @returns 
 */
function getIndexOfType(chordCode) {
  let startIndex = isNumeric(chordCode[0]) ? 2 : 1;
  for (let i = startIndex; i < chordCode.length; i++) {
    if (chordCode[i] !== '#' && chordCode[i] !== 'b') {
      return i;
    }
  }
  return chordCode.length;
}

function isNumeric(value) {
  return /^-?\d+$/.test(value);
}
/***
 * if an fbclid was inserted into the code, remove it here
 */
function removeFbclid(chordCode) {
  var startIndex = chordCode.indexOf("&fbclid")
  var fbCode = chordCode.substring(startIndex, startIndex + 69)
  chordCode = chordCode.replace(fbCode, "")
  console.log("fbCode removed: " + fbCode)
  return chordCode
}

function processSlashChord(chordCode, chord) {
  if (chordCode.includes(":")) {
    var slashNote = chordCode.split(":").pop()

    chord.slashNote = slashNote
    chord.slash = true

    chordCode = chordCode.replace(":" + slashNote, "")
  }
  return chordCode
}

export function getProgressionCode(state) {
  var synthCode = "?s=" + state.synth + ":" + state.volume

  var code = ""

  for (let i = 0; i < state.chordPianoSet.length; i++) {
    var chordPiano = state.chordPianoSet[i]
    var selectedChord = chordPiano.selectedChord

    if (!selectedChord) continue

    let chordLetter = getScaleAdjustedNoteLetter(state, selectedChord.noteLetter);

    var chordCode =
      selectedChord.octave + chordLetter + selectedChord.type

    if (chordPiano.isProgKey) chordCode += "*"

    if (isSlashChord(selectedChord)) {
      let newLetter = getScaleAdjustedNoteLetter(state, selectedChord.slashNote);
    
      selectedChord.slashNote = newLetter;
   
      // selectedChord.slashNote = updateFlatOrSharpLetter(
      //   chordPiano.showFlats,
      //   selectedChord.slashNote
      // )

      chordCode += ":" + selectedChord.slashNote
    }

    code += `(${chordCode})`
  }

  return synthCode + "&p=" + code
}

/**
 * Builds a space separated string of progression contained in the provided
 * chordPianoSet
 * 
 * @param {*} chordPianoSet 
 * @returns 
 */
export function getProgressionString(chordPianoSet) {
  let code = '';

  for (let i = 0; i < chordPianoSet.length; i++) {
    var chordPiano = chordPianoSet[i]
    var selectedChord = chordPiano.selectedChord

    if (!selectedChord) continue

    var chordCode =
      selectedChord.noteLetter + selectedChord.type

    if (isSlashChord(selectedChord)) {
      selectedChord.slashNote = updateFlatOrSharpLetter(
        chordPiano.showFlats,
        selectedChord.slashNote
      )

      chordCode += "/" + selectedChord.slashNote
    }

    let octave = '';

    if (selectedChord.octave !== 1) {
      octave = selectedChord.octave;
    }

    code += `${octave}${chordCode} `
  }

  return code;
}

export function isSlashChord(selectedChord) {
  return (
    selectedChord.slash &&
    selectedChord.slashNote &&
    selectedChord.slashNote !== ""
  )
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

/***
 * If the chordPiano is set to show flats and the provided letter is sharp,
 * find the corresponding flat letter. Likewise, if the chordPiano is
 * set to show sharps
 */

export function updateFlatOrSharpLetter(showFlats, noteLetter) {
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
 * @param {*} synthCode
 * @returns
 */
export function getSynthCode(synthCode) {
  
  // init with default synth values
  var synth = {
    volume: 90,
    type: "p"
  }

  if (synthCode != null) {
  
    if (hasSynthCode(synthCode)) {
      return synth
    }

    var codeSplit = synthCode.split(":")

    var type = codeSplit[0]
    var volume = codeSplit[1]

    if (isValidType(type)) {
      synth.type = type
    }

    if (isValidVol(volume)) {
      synth.volume = volume
    }
  }

  return synth
}

function hasSynthCode(synthCode) {
  return synthCode.split(":").length !== 2
}

function isValidType(type) {
  return Object.keys(synthTypes).includes(type)
}

function isValidVol(volume) {
  return volume != null && volume >= 0 && volume <= 100
}

export function getChordPianoSetFromProgCode(progCode) {

  if (progCode == null) return []

  var chordArray = progCode.split(")")

  var chordPianoSet = []

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

function validateProgKey(chordPiano, progKeySet) {
  // if the prog key is set here, only accept it
  // if we haven't already set the progKey

  if (chordPiano.isProgKey) {
    if (progKeySet) chordPiano.isProgKey = false
    else progKeySet = true
  }
  return progKeySet
}

export function buildProgFromCode(state, code) {

  if (state.building) {
    return
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

export function getQueryStringParams(query) {
  return query
    ? (/^[?]/.test(query) ? query.slice(1) : query)
        .split("&")
        .reduce((params, param) => {
          let [key, value] = param.split("=")
          params[key] = value
            ? decodeURIComponent(value.replace(/\+/g, " "))
            : ""
          return params
        }, {})
    : {}
}

export function updateUrlProgressionCode(state) {

  if (state.building) {
    return
  }
  
  var progressionCode = getProgressionCode(state)

  loadProgressionCode(state, progressionCode)
}

function loadProgressionCode(state, progressionCode) {

  if (state.currentProgCode) {
    state.previousProgCodes.push(state.currentProgCode)
  }

  state.currentProgCode = progressionCode

  state.history.push({
    search: progressionCode
  })
}

export function convertProgressionStrToCode(submittedProgressionStr) {
  let newProgressionString = ""

  submittedProgressionStr = submittedProgressionStr
    .replaceAll(',', ' ')
    .trim()
    .replace(/\s\s+/g, ' ') // convert multiple spaces to one

  for (let chordStr of submittedProgressionStr.split(' ')) {

    let chordCode = convertChordStrToCode(chordStr)

    newProgressionString += `(${chordCode})`
  }

  return newProgressionString;
}

function convertChordStrToCode(chordStr) {
  let octave = getOctave(chordStr)

  let chord = chordStr.replace(/(^\d+)(.+$)/i, '$2')
  let letter = getLetter(chord)

  let { type, slash } = getTypeAndSlash(chord, letter)

  return `${octave}${letter}${type}${slash}`;
}

function getTypeAndSlash(chord, letter) {

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
 * @param {*} type 
 * @returns 
 */
function sanitizeType(type) {

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

function getLetter(chord) {
  try {
    let letter = chord?.[0]
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

function getAccidentalAtIndex(chord, index) {
  if (chord?.[index] === '#' || chord?.[index]?.toLowerCase() === 'b') {
    return chord?.[index]?.toLowerCase()
  }
  return '';
}

function getOctave(chordStr) {
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

function upperCaseFirst(str){
  return str.charAt(0).toUpperCase() + str.substring(1);
}
