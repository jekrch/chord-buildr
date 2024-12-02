import { SelectedChord } from "./chordPianoHandler";
import { getNoteNumber } from "./noteManager";

// normalize key names to match the database format
const normalizeKey = (keyNoteNumber: number): string => {
    const keyMap: Record<number, string> = {
        1: 'C',
        2: 'Csharp',
        3: 'D',
        4: 'Eb',
        5: 'E',
        6: 'F',
        7: 'Fsharp',
        8: 'G',
        9: 'Ab',
        10: 'A',
        11: 'Bb',
        12: 'B'
    }
    return keyMap[keyNoteNumber];
  };
  
  // normalize suffix to match database format
  const normalizeSuffix = (suffix: string): string => {
    // handle special cases and normalize to database format
    const suffixMap: Record<string, string> = {
      'maj': 'major',
      '': 'major',
      'm': 'minor',
      '+': 'aug',
      'M7': 'maj7',
      'mM7': 'mmaj7',
      '7#5': 'aug7',
      '6/9': '69',
    };
  
    return suffixMap[suffix] || suffix;
  };
  
  interface ChordPosition {
    baseFret: number;
    frets: number[];
    fingers: number[];
    barres: number[];
    capo?: boolean;
    midi: number[];
  }
  
  interface ChordInfo {
    key: string;
    suffix: string;
    positions: ChordPosition[];
  }
  
  const parseChordName = (chordName: string): { root: string; suffix: string; bass?: string } => {
    // match pattern: root + suffix + optional bass note
    const pattern = /^([A-G][b#]?)([^/]*)(?:\/([A-G][b#]?))?$/;
    const match = chordName.match(pattern);
    
    if (!match) {
      throw new Error(`Invalid chord name: ${chordName}`);
    }
  
    return {
      root: match[1],
      suffix: match[2],
      bass: match[3]
    };
  };
  
  const findChordPositions = (
    selectedChord: SelectedChord, 
    guitarChords: Record<string, ChordInfo[]>
  ): ChordPosition[] => {
    try {

      let noteNumber = getNoteNumber(selectedChord.noteLetter);
      const root = selectedChord.noteLetter!;
      const suffix = selectedChord.type ?? '';
      // slash chords not yet supported
      //const bass = selectedChord.slashNote;

      // normalize the root note and suffix to match database format
      const normalizedRoot = normalizeKey(noteNumber!);

      // Not supported: add2 m13 7#11 m7#9 m7b9 m7#5 m7#11 9sus4
      const normalizedSuffix = normalizeSuffix(suffix);
      
      //console.log(normalizedRoot)
      //console.log(normalizedSuffix);

      // find the chord in the database
      const chordGroup = guitarChords[normalizedRoot];

      if (!chordGroup) {
        console.error(`No chord positions found for root note: ${root}`);
        return [];
      }
  
      // find the specific chord type
      const chord = chordGroup.find(c => c.suffix === normalizedSuffix);
      
      if (!chord) {
        console.warn(`No chord positions found for: ${root}${suffix}`);
        return [];
      }
    
      return chord.positions;

    } catch (error: any) {
      console.error(`Error finding chord positions: ${error.message}`);
      return [];
    }
  };
  
  export { findChordPositions, parseChordName, normalizeKey, normalizeSuffix };