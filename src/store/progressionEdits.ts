import type { Draft } from "immer"
import { getScaleAdjustedNoteLetter, noteIsInScale } from "../utils/chordManager"
import {
  ChordPiano,
  SelectedChord,
  SelectedKey,
  transposePianoBoard
} from "../utils/chordPianoHandler"
import { getFlatEquivalent, getSharpEquivalent, updateFlatOrSharpLetter } from "../utils/noteManager"

/**
 * the chord edits that ripple through the rest of the progression. they
 * change the chords they're given in place, so the store runs them on an
 * immer draft
 */

type Chords = Draft<ChordPiano>[]

export function findChord<T extends ChordPiano>(chords: T[], id: number): T | undefined {
  return chords.find((chord) => chord.id === id)
}

// the chord marked as the progression's key, if one is
export function getKeyChord(chords: readonly ChordPiano[]): SelectedChord | undefined {
  return chords.find((chord) => chord.isProgKey)?.selectedChord
}

// the letter spelled for the key's scale, when there is a key
export function getKeyRelativeLetter(chords: readonly ChordPiano[], letter: string): string {
  return getScaleAdjustedNoteLetter(getKeyChord(chords), letter)
}

/**
 * whether a chord's note menus list flats: set on the chord, or implied by
 * a root or bass note already spelled with one
 */
export function showsFlats(chord: ChordPiano): boolean {
  return Boolean(
    chord.showFlats ||
    chord.selectedChord.noteLetter?.includes("b") ||
    chord.selectedChord.slashNote?.includes("b")
  )
}

/**
 * changes a chord's root. a key chord carries the whole progression with
 * it (transposing every other chord), then respells them for its scale
 */
export function setChordRoot(chords: Chords, id: number, key: SelectedKey): void {
  const chord = findChord(chords, id)
  if (!chord) return

  const noteLetter = updateFlatOrSharpLetter(chord.showFlats ?? false, key.noteLetter)

  if (chord.isProgKey) {
    transposePianoBoard(id, chords, chord, key)
  }

  chord.selectedChord.noteLetter = chord.isProgKey
    ? noteLetter
    : getKeyRelativeLetter(chords, noteLetter)
  chord.selectedChord.octave = key.octave

  if (chord.isProgKey) alignChordsToKey(chords, chord)
}

/**
 * switches a chord between sharps and flats. on the key chord this
 * respells its root (A# <-> Bb), and so every chord in the key with it
 */
export function setShowFlats(chords: Chords, id: number, showFlats: boolean): void {
  const chord = findChord(chords, id)
  if (!chord) return

  const shownLetter = updateFlatOrSharpLetter(showsFlats(chord), chord.selectedChord.noteLetter ?? "C")

  chord.showFlats = showFlats
  chord.selectedChord.noteLetter = getKeyRelativeLetter(
    chords,
    updateFlatOrSharpLetter(showFlats, chord.selectedChord.noteLetter ?? "C")
  )

  if (!chord.isProgKey || shownLetter.length < 2) return

  let newLetter: string | undefined
  if (shownLetter.endsWith("b") && !showFlats) {
    newLetter = getSharpEquivalent(shownLetter)
  } else if (shownLetter.includes("#") && showFlats) {
    newLetter = getFlatEquivalent(shownLetter)
  }

  if (newLetter) {
    setChordRoot(chords, id, { noteLetter: newLetter, octave: chord.selectedChord.octave ?? 0 })
  }
}

/**
 * makes a chord the progression's key, or stops it being the key. a new
 * key respells the other chords for its scale (e.g. A# -> Bb in F)
 */
export function setProgKey(chords: Chords, id: number, isKey: boolean): void {
  const chord = findChord(chords, id)
  if (!chord) return

  if (!isKey) {
    chord.isProgKey = false
    return
  }

  chords.forEach((other) => { other.isProgKey = false })
  chord.isProgKey = true
  alignChordsToKey(chords, chord)
}

export function setSlashChord(chords: Chords, id: number, isSlash: boolean): void {
  const chord = findChord(chords, id)
  if (!chord) return

  chord.selectedChord.slashNote = isSlash
    ? updateFlatOrSharpLetter(showsFlats(chord), chord.selectedChord.slashNote ?? "")
    : ""
  chord.selectedChord.slash = isSlash
}

/**
 * respells every chord's root and bass note that's in the key chord's
 * scale the way that scale spells it, e.g. A# -> Bb in F major
 */
function alignChordsToKey(chords: Chords, keyChord: Draft<ChordPiano>): void {
  const key = keyChord.selectedChord

  for (const chord of chords) {
    const { noteLetter, slash, slashNote } = chord.selectedChord

    if (chord.id !== keyChord.id && noteLetter && noteIsInScale(key, noteLetter)) {
      chord.selectedChord.noteLetter = getScaleAdjustedNoteLetter(key, noteLetter)
    }

    if (slash && slashNote && noteIsInScale(key, slashNote)) {
      chord.selectedChord.slashNote = getScaleAdjustedNoteLetter(key, slashNote)
    }
  }
}
