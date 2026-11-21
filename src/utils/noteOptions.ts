import { noteLetterMapWithFlats, noteLetterMapWithSharps } from "./noteManager"
import { equalChroma, getScaleAdjustedNoteLetter, noteIsInScale } from "./chordManager"
import { SelectedChord } from "./chordPianoHandler"

/**
 * a note spelled for the key's scale, when there is a key and the note is
 * in it. an empty note is taken as C
 */
export function spellForKey(keyChord: SelectedChord | undefined, noteLetter: string): string {
  if (!noteLetter.trim()) return "C"
  return getScaleAdjustedNoteLetter(keyChord, noteLetter) || noteLetter
}

/**
 * the twelve notes, one per pitch, for a chord's root and bass note menus,
 * spelled with flats or sharps and then for the key's scale.
 *
 * unless both of the chord's notes are in the key, its own spellings take
 * the place of their pitches, so a choice like B# over C, which the key
 * wouldn't spell that way, is kept rather than coerced
 */
export function getNoteOptions(
  keyChord: SelectedChord | undefined,
  showFlats: boolean,
  noteLetter?: string,
  slashNote?: string
): string[] {
  let notes: string[] = Object.values(
    showFlats && !noteLetter?.startsWith("#") ? noteLetterMapWithFlats : noteLetterMapWithSharps
  )

  if (keyChord) {
    notes = notes.map((n) => getScaleAdjustedNoteLetter(keyChord, n))
  }

  const root = noteLetter ?? ""
  const bass = slashNote ?? ""

  if (keyChord && noteIsInScale(keyChord, root) && noteIsInScale(keyChord, bass)) {
    return notes
  }

  return notes.map((n) => {
    if (equalChroma(n, root)) return root
    if (equalChroma(n, bass)) return bass
    return n
  })
}

/** the root menu's notes, each spelled for the key */
export function getRootOptions(keyChord: SelectedChord | undefined, noteOptions: string[]): string[] {
  return noteOptions.map((option) => spellForKey(keyChord, option))
}

/**
 * the bass note menu's notes, each spelled for the key, with the chord's
 * own bass note standing in for its pitch
 */
export function getSlashOptions(
  keyChord: SelectedChord | undefined,
  noteOptions: string[],
  slashNote: string
): string[] {
  return noteOptions
    .map((option) => option.trim())
    .filter(Boolean)
    .map((option) => spellForKey(keyChord, equalChroma(slashNote, option) ? slashNote : option))
}
