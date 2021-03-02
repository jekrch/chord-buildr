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

    var chordCode

    // if (selectedChord.invalidCode === undefined) {
    //   chordCode =
    //     selectedChord.octave + selectedChord.noteLetter + selectedChord.type
    // } else {
    //   chordCode = selectedChord.invalidCode
    // }

    chordCode =
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
