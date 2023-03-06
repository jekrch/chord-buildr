import { isValidChordType } from "./chordManager"
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
    chordCode = chordCode.replace("(", "")

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

    var indexOfType =
      chordCode.substring(2, 3) === "#" || chordCode.substring(2, 3) === "b"
        ? 3
        : 2

    chord.noteLetter = capitalizeFirstLetter(
      chordCode.substring(1, indexOfType)
    )
    chord.type = chordCode.substring(indexOfType)
  } catch (ex) {
    console.log(ex)
    console.log("Exception - invalid chord code: " + chordCode)
    return
  }

  if (!(isValidChordType(chord.type) && isValidLetter(chord.noteLetter))) {
    console.log(
      "Invalid chord code: " +
        chordCode +
        "; letter: " +
        chord.noteLetter +
        "; type: " +
        chord.type
    )
    return
  }

  return chord
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

    var chordCode =
      selectedChord.octave + selectedChord.noteLetter + selectedChord.type

    if (chordPiano.isProgKey) chordCode += "*"

    if (isSlashChord(selectedChord)) {
      selectedChord.slashNote = updateFlatOrSharpLetter(
        chordPiano.showFlats,
        selectedChord.slashNote
      )

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

    code += `${chordCode} `
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
      return noteLetterMapWithFlats[noteNumber]
    }
  } else if (noteLetter.includes("b")) {
    return noteLetterMapWithSharps[noteNumber]
  }

  return noteLetter
}
