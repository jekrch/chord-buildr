import { NoteKey } from "./chordPianoHandler";

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

export const pianoGenerator = (): NoteKey[][] => {
  const piano: NoteKey[][] = [];
  const octaves = 3;

  for (let i = 0; i < octaves; i++) {
    // i is each octave
    const pianoKeysOctave: NoteKey[] = pianoKeys.map((key, index) => ({
      note: key.note,
      color: key.color,
      selected: false,
      noteNumber: index + 1,
      octave: i,
      isPlaying: false,
      isStopping: false
    } as NoteKey));

    piano.push(pianoKeysOctave);
  }

  return piano;
};

// deselect all keys in the provided piano
export function clearPianoSelections(piano: NoteKey[][]): void {
  piano.forEach(pianoOctave => {
    pianoOctave.forEach(key => {
      key.selected = false;
    });
  });
}