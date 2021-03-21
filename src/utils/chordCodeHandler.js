import { isValidChordType } from "./chordManager"
import { isValidLetter } from "./noteManager"

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

    var indexOfType = chordCode.substring(2, 3) === "#" ? 3 : 2

    chord.noteLetter = chordCode.substring(1, indexOfType).toUpperCase()
    chord.type = chordCode.substring(indexOfType)

    console.log(chord)
  } catch (ex) {
    console.log("Exception - invalid chord code: " + chordCode)
    return
  }

  if (!(isValidChordType(chord.type) && isValidLetter(chord.noteLetter))) {
    console.log("Invalid chord code: " + chordCode)
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
  var code = ""

  for (let i = 0; i < state.chordPianoSet.length; i++) {
    var chordPiano = state.chordPianoSet[i]
    var selectedChord = chordPiano.selectedChord

    if (!selectedChord) continue

    var chordCode =
      selectedChord.octave + selectedChord.noteLetter + selectedChord.type

    if (chordPiano.isProgKey) chordCode += "*"

    if (isSlashChord(selectedChord)) {
      chordCode += ":" + selectedChord.slashNote
    }

    code += `(${chordCode})`
  }

  return code
}

export function isSlashChord(selectedChord) {
  return (
    selectedChord.slash &&
    selectedChord.slashNote &&
    selectedChord.slashNote !== ""
  )
}
