// represents a single piano key with its properties
type PianoKey = {
  note: string;
  color: 'black' | 'white';
  selected?: boolean;
  noteNumber?: number;
  octave?: number;
};

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

export const pianoGenerator = (): PianoKey[][] => {
  const piano: PianoKey[][] = [];
  const octaves = 3;

  for (let i = 0; i < octaves; i++) {
    // i is each octave
    const pianoKeysOctave: PianoKey[] = pianoKeys.map((key, index) => ({
      note: key.note,
      color: key.color,
      selected: false,
      noteNumber: index + 1,
      octave: i,
    }));

    piano.push(pianoKeysOctave);
  }

  return piano;
};

// deselect all keys in the provided piano
export function clearPianoSelections(piano: PianoKey[][]): void {
  piano.forEach(pianoOctave => {
    pianoOctave.forEach(key => {
      key.selected = false;
    });
  });
}