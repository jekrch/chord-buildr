import guitar from "@tombatossals/chords-db/lib/guitar.json"

// normalize key names to match the database format
const normalizeKey = (key: string): string => {
    // handle special cases and normalize to database format
    const keyMap: Record<string, string> = {
      'C#': 'Csharp',
      'Db': 'Csharp',
      'D#': 'Eb',
      'Gb': 'Fsharp',
      'G#': 'Ab',
      'A#': 'Bb',
      // add other enharmonic equivalents as needed
    };
  
    return keyMap[key] || key;
  };
  
  // normalize suffix to match database format
  const normalizeSuffix = (suffix: string): string => {
    // handle special cases and normalize to database format
    const suffixMap: Record<string, string> = {
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
    chordName: string, 
    guitarChords: Record<string, ChordInfo[]>
  ): ChordPosition[] => {
    try {
      const { root, suffix, bass } = parseChordName(chordName);
      
      // normalize the root note and suffix to match database format
      const normalizedRoot = normalizeKey(root);
      const normalizedSuffix = normalizeSuffix(suffix);
      
      // find the chord in the database
      const chordGroup = guitarChords[normalizedRoot];
      if (!chordGroup) {
        throw new Error(`No chord positions found for root note: ${root}`);
      }
  
      // find the specific chord type
      const chord = chordGroup.find(c => c.suffix === normalizedSuffix);
      if (!chord) {
        throw new Error(`No chord positions found for: ${root}${suffix}`);
      }
  
      // if it's a slash chord, we might want to filter or sort positions
      // that make the bass note easier to play
      if (bass) {
        // this could be enhanced to actually filter/sort based on bass note
        return chord.positions;
      }
  
      return chord.positions;
    } catch (error: any) {
      console.error(`Error finding chord positions: ${error.message}`);
      return [];
    }
  };
  
  export { findChordPositions, parseChordName, normalizeKey, normalizeSuffix };