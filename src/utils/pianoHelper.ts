import { NoteKey, PIANO_OCTAVES } from "./chordPianoHandler";

interface PianoKey {
  note: string
  color: 'white' | 'black'
}

const pianoKeys: readonly PianoKey[] = [
  { note: 'C', color: 'white' },
  { note: 'C#', color: 'black' },
  { note: 'D', color: 'white' },
  { note: 'D#', color: 'black' },
  { note: 'E', color: 'white' },
  { note: 'F', color: 'white' },
  { note: 'F#', color: 'black' },
  { note: 'G', color: 'white' },
  { note: 'G#', color: 'black' },
  { note: 'A', color: 'white' },
  { note: 'A#', color: 'black' },
  { note: 'B', color: 'white' },
] as const;

/**
 * the keys of a chord card's piano, three octaves of 12, with the given
 * keys (see getChordKeys) down
 */
export function getPianoKeys(selectedKeys: readonly number[]): NoteKey[][] {
  const selected = new Set(selectedKeys)

  return Array.from({ length: PIANO_OCTAVES }, (_, octave) =>
    pianoKeys.map((key, index) => ({
      note: key.note,
      color: key.color,
      selected: selected.has(octave * 12 + index),
      noteNumber: index + 1,
      octave
    }))
  )
}

/**
 * the note a piano key plays, e.g. key 4 (the first octave's E) is "E3".
 * the card's lowest C is C3
 */
export function getKeyNoteName(keyIndex: number): string {
  const octave = Math.floor(keyIndex / 12)
  return `${pianoKeys[keyIndex % 12]?.note ?? ""}${octave + 3}`
}
