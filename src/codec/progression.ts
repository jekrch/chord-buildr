import { getScaleAdjustedNoteLetter } from "../utils/chordManager"
import { updateFlatOrSharpLetter } from "../utils/noteManager"
import type { ChordPiano } from "../utils/chordPianoHandler"
import { isSlashChord, parseChordCode } from "./chord"

/**
 * a chord as the progression code carries it: everything about a chord
 * piano except its keys, which are worked out from the chord
 */
export type CodedChord = Pick<ChordPiano, "id" | "selectedChord" | "isProgKey" | "showFlats" | "breakAfter">

// what writing a chord's code reads; a ChordPiano works as is
export type CodableChord = Pick<ChordPiano, "selectedChord" | "isProgKey" | "showFlats" | "breakAfter">

/**
 * a section break after a chord. in the url it's a code of its own,
 * (1C)(1G)(-)(1Am), so versions that don't know it skip it as an invalid
 * chord
 */
export const SECTION_BREAK_CODE = "-"

/**
 * reads a progression code, e.g. (1C*)(1G)(-)(1Am:E). invalid chords are
 * skipped, only the first chord marked as the key keeps it, and breaks
 * attach to the chord before them, so leading and repeated ones collapse
 * away. a chord's id is the place of its code in the progression code
 */
export function parseProgressionCode(progCode: string | null): CodedChord[] {
  if (progCode == null) return []

  const chordArray = progCode.split(")")
  const chords: CodedChord[] = []
  let progKeySet = false
  let breakId = 0

  for (const [i, chordCode] of chordArray.entries()) {
    if (chordCode === "") continue

    if (chordCode.trim() === `(${SECTION_BREAK_CODE}`) {
      const lastChord = chords[chords.length - 1]
      if (lastChord && lastChord.breakAfter === undefined) {
        lastChord.breakAfter = breakId++
      }
      continue
    }

    const chord = parseChordCode(chordCode)

    if (!chord) continue

    // only the first chord marked as the key keeps it
    const isProgKey = chord.isKey === true && !progKeySet
    if (isProgKey) progKeySet = true

    chords.push({
      id: i,
      showFlats:
        chord.noteLetter?.includes("b") ||
        (chord.slashNote != null && chord.slashNote.includes("b")),
      isProgKey,
      selectedChord: {
        noteLetter: chord.noteLetter,
        type: chord.type,
        octave: chord.octave,
        slash: chord.slash,
        slashNote: chord.slashNote,
        position: chord.position
      }
    })
  }

  return chords
}

/**
 * writes a progression code. roots and slash notes are spelled for the
 * key chord's scale, when there is one
 */
export function serializeProgressionCode(chords: CodableChord[]): string {
  const keyChord = chords.find(c => c.isProgKey)?.selectedChord

  return chords
    .map(chordPiano => {
      const chord = chordPiano.selectedChord
      if (!chord) return ""

      const chordLetter = getScaleAdjustedNoteLetter(keyChord, chord.noteLetter)

      let chordCode = `${chord.octave}${chordLetter}${chord.type}`

      if (chordPiano.isProgKey) chordCode += "*"

      if (isSlashChord(chord)) {
        const adjustedSlashNote = getScaleAdjustedNoteLetter(
          keyChord,
          updateFlatOrSharpLetter(chordPiano.showFlats || false, chord.slashNote as string)
        )
        chordCode += `:${adjustedSlashNote}`
      }

      if (chord.position) {
        chordCode += `.${chord.position + 1}`
      }

      const breakCode = chordPiano.breakAfter !== undefined ? `(${SECTION_BREAK_CODE})` : ""

      return `(${chordCode})${breakCode}`
    })
    .join("")
}
