import { ChordPiano, SelectedChord } from "./chordPianoHandler";
import { chordMap } from "./chordManager";
import { getNoteNumber } from "./noteManager";
import guitar from '@tombatossals/chords-db/lib/guitar.json';
import ukulele from '@tombatossals/chords-db/lib/ukulele.json';

export interface Instrument {
  strings: number,
  fretsOnChord: number,
  name: string,
  tunings: { standard: string[] }
  chords: Record<string, ChordInfo[]>
}

export const guitarInstrument: Instrument = {
  strings: 6,
  fretsOnChord: 4,
  name: "Guitar",
  tunings: {
    standard: ["E", "A", "D", "G", "B", "E"],
  },
  chords: guitar.chords
}

export const ukuleleInstrument: Instrument = {
  strings: 4,
  fretsOnChord: 4,
  name: 'Ukulele',
  tunings: {
      standard:["G","C","E","A"]
  },
  chords: ukulele.chords
}

/**
 * Returns the guitar instrument (standard or ukulele) corresponding to 
 * the provided format code.
 * 
 * @param format 
 * @returns 
 */
function getInstrumentByFormat(format: string): Instrument {
  switch(format) {
    case "g": 
      return guitarInstrument;
    case "u":
      return ukuleleInstrument;
    default:
      throw Error("Invalid guitar format")
  } 
}

/**
 * Returns whether the provided format is a "guitar" format. This 
 * covers either standard 6 string or ukulele 
 * 
 * @param format 
 * @returns 
 */
function isGuitar(format: string): boolean {
  return ["g", "u"].includes(format)
}

/**
 * Chord types with no diagram in any key, by format. Types are only listed
 * once nothing fits, borrowed and moved-note voicings included (see
 * findFallbackPositions).
 */
export const UNSUPPORTED_GUITAR_CHORDS: Record<string, string[]> = {
  g: [
    'm7#11',
    '5',
    'x'
  ],
  u: [
    'm13',
    '7#11',
    'm7b9',
    'm7#11',
    '9sus4',
    '5',
    // chords-db's "alt" voicings are 1 3 b5, not the altered dominant in
    // chordMap, and no other ukulele voicing has the right notes
    'alt',
    'x'
  ]
}

const guitarKeyMap: Record<number, string> = {
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

const ukuleleKeyMap: Record<number, string> = {
  1: 'C',
  2: 'Db',
  3: 'D',
  4: 'Eb',
  5: 'E',
  6: 'F',
  7: 'Gb',
  8: 'G',
  9: 'Ab',
  10: 'A',
  11: 'Bb',
  12: 'B'
}

// normalize key names to match the database format
const normalizeKey = (keyNoteNumber: number, format: string): string => {
    const keyMap: Record<number, string> = format === "g" ? guitarKeyMap : ukuleleKeyMap;
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
  
  export interface ChordPosition {
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
  
  /**
   * Returns the intervals (semitones above the root, 0-11) sounded by the
   * position that don't belong to the chord type. Leaving chord tones out
   * is fine; any interval returned here means the voicing is wrong.
   */
  const getNonChordIntervals = (
    position: ChordPosition,
    rootNoteNumber: number,
    type: string
  ): number[] => {
    const chordIntervals = new Set((chordMap[type] ?? []).map(interval => interval % 12));
    // note numbers start at C = 1
    const rootPitchClass = (rootNoteNumber - 1) % 12;
    const sounded = new Set(position.midi.map(midi => (midi - rootPitchClass + 12) % 12));

    return [...sounded]
      .filter(interval => !chordIntervals.has(interval))
      .sort((a, b) => a - b);
  };

  /**
   * Returns the intervals (0-11) a voicing has to sound to count as the chord
   * type. The perfect 5th may be left out of chords with four or more notes,
   * as is usual on guitar, unless the chord also has a b5/#11 or #5: without
   * the natural 5th those read as an altered fifth (a m7#11 with no 5th is a
   * m7b5). 13th chords may also leave out the 11th, as they usually do.
   */
  const getRequiredIntervals = (type: string): number[] => {
    const chordIntervals = chordMap[type] ?? [];
    const intervals = [...new Set(chordIntervals.map(interval => interval % 12))];
    const optional = new Set<number>();
    if (intervals.length >= 4 && !intervals.includes(6) && !intervals.includes(8)) {
      optional.add(7);
    }
    if (chordIntervals.includes(21) && chordIntervals.includes(17)) {
      optional.add(17 % 12);
    }
    return intervals.filter(interval => !optional.has(interval));
  };

  /**
   * Whether the position sounds every required tone of the chord type and
   * nothing outside it
   */
  const isVoicingOf = (position: ChordPosition, rootNoteNumber: number, type: string): boolean => {
    if (getNonChordIntervals(position, rootNoteNumber, type).length) {
      return false;
    }
    const rootPitchClass = (rootNoteNumber - 1) % 12;
    const sounded = new Set(position.midi.map(midi => (midi - rootPitchClass + 12) % 12));
    return getRequiredIntervals(type).every(interval => sounded.has(interval));
  };

  // both instruments' diagrams show four frets
  const DIAGRAM_FRETS = 4;

  /**
   * The position's frets counted from the nut rather than from its base
   * fret: 0 is an open string and -1 a muted one
   */
  const getAbsoluteFrets = (position: ChordPosition): number[] =>
    position.frets.map(fret => (fret > 0 ? fret + position.baseFret - 1 : fret));

  /**
   * The midi note each string sounds, or null for muted strings
   */
  const getStringMidi = (position: ChordPosition): (number | null)[] => {
    let next = 0;
    return position.frets.map(fret => (fret < 0 ? null : position.midi[next++]));
  };

  /**
   * Returns the finger on each string (0 for open and muted strings) for
   * frets counted from the nut, or null when one hand can't hold them. A
   * barre is one finger on every note at its fret; every other note gets a
   * finger of its own, numbered from the lowest fret up (low strings first
   * at the same fret). A barre can't pass over an open string or a lower
   * note, and two fingers stretch at most one fret further apart than one
   * finger per fret.
   */
  const getFingering = (frets: number[], barres: number[], capo: boolean): number[] | null => {
    const slots: { fret: number, strings: number[] }[] = [];

    for (const [i, barre] of barres.entries()) {
      const strings = frets.flatMap((fret, string) => (fret === barre ? [string] : []));
      // a capo barre is drawn across every string
      const [first, last] = capo && i === 0
        ? [0, frets.length - 1]
        : [strings[0], strings[strings.length - 1]];
      if (frets.slice(first, last + 1).some(fret => fret === 0 || (fret > 0 && fret < barre))) {
        return null;
      }
      slots.push({ fret: barre, strings });
    }

    frets.forEach((fret, string) => {
      if (fret > 0 && !barres.includes(fret)) slots.push({ fret, strings: [string] });
    });

    if (slots.length > 4) return null;

    slots.sort((a, b) => a.fret - b.fret || a.strings[0] - b.strings[0]);
    for (let a = 0; a < slots.length; a++) {
      for (let b = a + 1; b < slots.length; b++) {
        if (slots[b].fret - slots[a].fret > b - a + 1) return null;
      }
    }

    const fingers = frets.map(() => 0);
    slots.forEach((slot, i) => slot.strings.forEach(string => { fingers[string] = i + 1; }));
    return fingers;
  };

  /**
   * Returns the position with the notes on the strings moved by the number
   * of frets, keeping its barres that still hold two notes, or null when the
   * result doesn't fit the diagram or a hand (see getFingering).
   */
  const moveNotes = (position: ChordPosition, strings: number[], by: number): ChordPosition | null => {
    const frets = getAbsoluteFrets(position);
    const stringMidi = getStringMidi(position);

    for (const string of strings) {
      if (frets[string] < 0 || frets[string] + by < 0) return null;
      frets[string] += by;
      stringMidi[string] = stringMidi[string]! + by;
    }

    return buildPosition(position, frets, stringMidi);
  };

  /**
   * Returns the position for new frets counted from the nut (-1 muted) and
   * the midi note each string sounds, made from the position they came from:
   * it keeps the old barres that still hold two notes and works out the
   * fingers again. Null when the frets don't fit the diagram or a hand (see
   * getFingering).
   */
  const buildPosition = (
    position: ChordPosition,
    frets: number[],
    stringMidi: (number | null)[]
  ): ChordPosition | null => {
    const fretted = frets.filter(fret => fret > 0);
    const low = Math.min(...fretted);
    const high = Math.max(...fretted);
    let baseFret: number;
    if (!fretted.length || high <= DIAGRAM_FRETS) {
      baseFret = 1;
    } else if (low >= position.baseFret && high < position.baseFret + DIAGRAM_FRETS) {
      baseFret = position.baseFret;
    } else if (high - low < DIAGRAM_FRETS) {
      baseFret = low;
    } else {
      return null;
    }

    const originalBarres = position.barres.map(barre => barre + position.baseFret - 1);
    const barres = originalBarres.filter(barre => frets.filter(fret => fret === barre).length >= 2);
    const capo = Boolean(position.capo) && barres.length > 0 && barres[0] === originalBarres[0];
    const fingers = getFingering(frets, barres, capo);
    if (!fingers) return null;

    return {
      baseFret,
      frets: frets.map(fret => (fret > 0 ? fret - baseFret + 1 : fret)),
      fingers,
      barres: barres.map(barre => barre - baseFret + 1),
      capo,
      midi: stringMidi.filter((midi): midi is number => midi !== null),
    };
  };

  /**
   * A way to make a chord type chords-db doesn't have from shapes for a
   * related chord, by moving one chord tone along its string, the way
   * guitarists learn these chords: a m7#5 is a m7 shape with the 5th raised
   * a fret.
   */
  interface NoteMove {
    // chords-db suffixes of the shapes to start from
    from: string[];
    // the chord tone to move, in semitones above the root
    interval: number;
    // how many frets to move it, up (+) or down (-)
    by: number;
    // 'all' moves every string sounding the tone, leaving none of it behind;
    // 'one' moves one of them, making a voicing for each choice. Neither
    // moves the bass note.
    strings: 'all' | 'one';
  }

  const NOTE_MOVES: Record<string, NoteMove[]> = {
    'm7#5': [{ from: ['m7'], interval: 7, by: 1, strings: 'all' }],
    'm7b9': [{ from: ['m9'], interval: 2, by: -1, strings: 'all' }],
    '9sus4': [{ from: ['9'], interval: 4, by: 1, strings: 'all' }],
    // a doubled root down a whole step to the b7
    '7sus2': [{ from: ['sus2'], interval: 0, by: -2, strings: 'one' }],
    // a 5th up a whole step to the 13th
    'm13': [{ from: ['m9', 'm11'], interval: 7, by: 2, strings: 'one' }],
  };

  /**
   * Returns the voicings NOTE_MOVES makes for the chord type from the root's
   * chords-db shapes. They still need checking for the chord's notes.
   */
  const findMovedPositions = (
    chordGroup: ChordInfo[],
    rootNoteNumber: number,
    type: string
  ): ChordPosition[] => {
    const rootPitchClass = (rootNoteNumber - 1) % 12;

    return (NOTE_MOVES[type] ?? []).flatMap(move =>
      chordGroup
        .filter(chord => move.from.includes(chord.suffix))
        .flatMap(chord => chord.positions)
        .flatMap(position => {
          const stringMidi = getStringMidi(position);
          const strings = stringMidi.flatMap((midi, s) =>
            midi !== null && (midi - rootPitchClass + 120) % 12 === move.interval ? [s] : []);

          // the bass note stays put: moving it would make a different chord
          // (a m7 shape with its 5th in the bass and raised is an add9 chord)
          const bass = Math.min(...stringMidi.filter((midi): midi is number => midi !== null));
          const movable = strings.filter(s => stringMidi[s] !== bass);

          if (move.strings === 'all') {
            return movable.length && movable.length === strings.length
              ? [moveNotes(position, strings, move.by)]
              : [];
          }
          return movable.map(s => moveNotes(position, [s], move.by));
        })
        .filter((position): position is ChordPosition => position !== null)
    );
  };

  /**
   * Returns voicings for a chord type chords-db has no correct voicing for
   * under its own name, lowest on the neck first:
   * - shapes filed under the root's other chord names that sound the right
   *   notes: an add9 shape is also an add2, and a 9#11 shape without the 9th
   *   is a 7#11
   * - shapes made by moving one note of a related chord's shape (NOTE_MOVES)
   */
  const findFallbackPositions = (
    chordGroup: ChordInfo[],
    rootNoteNumber: number,
    type: string
  ): ChordPosition[] => {
    const borrowed = chordGroup
      // slash chords put a note other than the root in the bass
      .filter(chord => !chord.suffix.includes('/'))
      .flatMap(chord => chord.positions);
    const moved = findMovedPositions(chordGroup, rootNoteNumber, type);
    const shapes = new Set<string>();

    // borrowed shapes come first so a chords-db fingering wins over a moved
    // shape that ends up the same
    return [...borrowed, ...moved]
      .filter(position => isVoicingOf(position, rootNoteNumber, type))
      .filter(position => {
        const shape = getAbsoluteFrets(position).join();
        if (shapes.has(shape)) return false;
        shapes.add(shape);
        return true;
      })
      .sort((a, b) => a.baseFret - b.baseFret);
  };

  // midi notes of the open strings, low string first, in standard tuning
  const OPEN_STRING_MIDI: Record<string, number[]> = {
    g: [40, 45, 50, 55, 59, 64],
    // re-entrant tuning: the G string is above middle C
    u: [67, 60, 64, 69],
  };

  // the fewest strings a slash chord voicing made here (see
  // findBassNotePositions) may sound
  const MIN_SLASH_STRINGS: Record<string, number> = { g: 4, u: 3 };

  // the highest fret a bass note is put on
  const MAX_BASS_FRET = 15;

  const getBassPitchClass = (position: ChordPosition): number =>
    Math.min(...position.midi) % 12;

  /**
   * Whether the position sounds the chord type over the bass note: the bass
   * note is the lowest note, every other note belongs to the chord, and
   * every required tone sounds (see getRequiredIntervals)
   */
  const isSlashVoicingOf = (
    position: ChordPosition,
    rootNoteNumber: number,
    type: string,
    bassPitchClass: number
  ): boolean => {
    if (getBassPitchClass(position) !== bassPitchClass) return false;
    const rootPitchClass = (rootNoteNumber - 1) % 12;
    const bassInterval = (bassPitchClass - rootPitchClass + 12) % 12;
    if (getNonChordIntervals(position, rootNoteNumber, type).some(interval => interval !== bassInterval)) {
      return false;
    }
    const sounded = new Set(position.midi.map(midi => (midi - rootPitchClass + 12) % 12));
    return getRequiredIntervals(type).every(interval => sounded.has(interval));
  };

  /**
   * Returns voicings of a slash chord made from voicings of the chord
   * without its bass note, the way guitarists make them: one string is moved
   * to (or put on) the bass note and the strings that would sound below it
   * are muted. G 320003 with its low string muted is a G/B; C x32010 with
   * the low string on the 3rd fret is a C/G. Only strings lower than the
   * bass note's string are muted, and the result still has to sound the
   * whole chord. Unchecked strings count as playable; see buildPosition.
   */
  const findBassNotePositions = (
    sources: ChordPosition[],
    rootNoteNumber: number,
    type: string,
    bassPitchClass: number,
    format: string
  ): ChordPosition[] => {
    const openMidi = OPEN_STRING_MIDI[format];

    return sources.flatMap(position => {
      const frets = getAbsoluteFrets(position);
      const stringMidi = getStringMidi(position);

      return openMidi.flatMap((open, string) => {
        const voicings: ChordPosition[] = [];

        for (let fret = (bassPitchClass - (open % 12) + 12) % 12; fret <= MAX_BASS_FRET; fret += 12) {
          const bass = open + fret;
          const below = stringMidi.flatMap((midi, s) =>
            s !== string && midi !== null && midi < bass ? [s] : []);
          if (below.some(s => s > string)) continue;

          const newFrets = frets.map((f, s) => (s === string ? fret : below.includes(s) ? -1 : f));
          const newMidi = stringMidi.map((midi, s) => (s === string ? bass : below.includes(s) ? null : midi));
          if (newMidi.filter(midi => midi !== null).length < MIN_SLASH_STRINGS[format]) continue;

          const voicing = buildPosition(position, newFrets, newMidi);
          if (voicing && isSlashVoicingOf(voicing, rootNoteNumber, type, bassPitchClass)) {
            voicings.push(voicing);
          }
        }
        return voicings;
      });
    });
  };

  /**
   * Returns voicings of the chord type over a bass note other than its
   * root, lowest on the neck first, from:
   * - the chord's own voicings that already have the bass note lowest
   * - chords-db shapes filed under the root's other names, its slash chords
   *   included (C "/E" is a C/E), that sound the slash chord
   * - voicings made by moving or adding a bass note (findBassNotePositions)
   */
  const findSlashPositions = (
    chordGroup: ChordInfo[],
    positions: ChordPosition[],
    rootNoteNumber: number,
    type: string,
    bassPitchClass: number,
    format: string
  ): ChordPosition[] => {
    const inverted = positions.filter(position => getBassPitchClass(position) === bassPitchClass);
    const borrowed = chordGroup
      .flatMap(chord => chord.positions)
      .filter(position => isSlashVoicingOf(position, rootNoteNumber, type, bassPitchClass));
    const sources = [...positions, ...findFallbackPositions(chordGroup, rootNoteNumber, type)];
    const made = findBassNotePositions(sources, rootNoteNumber, type, bassPitchClass, format);

    const shapes = new Set<string>();
    // chords-db fingerings win over made shapes that end up the same, and
    // the sort keeps them first among voicings at the same fret
    return [...inverted, ...borrowed, ...made]
      .filter(position => {
        const shape = getAbsoluteFrets(position).join();
        if (shapes.has(shape)) return false;
        shapes.add(shape);
        return true;
      })
      .sort((a, b) => a.baseFret - b.baseFret);
  };

  const parseChordName =(chordName: string): { root: string; suffix: string; bass?: string } => {
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
  
  /**
   * The voicings to show for a chord. bassMissing is set when it's a slash
   * chord that no voicing has the bass note under, so the voicings are the
   * chord's without it.
   */
  export interface ChordVoicings {
    positions: ChordPosition[];
    bassMissing: boolean;
  }

  const findChordVoicings = (
    selectedChord: SelectedChord,
    guitarChords: Record<string, ChordInfo[]>,
    format: string
  ): ChordVoicings => {
    const voicings = (positions: ChordPosition[], bassMissing = false): ChordVoicings =>
      ({ positions, bassMissing });

    try {

      const noteNumber = getNoteNumber(selectedChord.noteLetter);
      const root = selectedChord.noteLetter!;
      const suffix = selectedChord.type ?? '';
      const bassNoteNumber = selectedChord.slash ? getNoteNumber(selectedChord.slashNote) : undefined;

      // normalize the root note and suffix to match database format
      const normalizedRoot = normalizeKey(noteNumber!, format);

      // Not supported: see UNSUPPORTED_GUITAR_CHORDS
      const normalizedSuffix = normalizeSuffix(suffix);
      
      //console.log(normalizedRoot)
      //console.log(normalizedSuffix);

      // find the chord in the database
      const chordGroup = guitarChords[normalizedRoot];

      if (!chordGroup) {
        console.error(`No chord positions found for root note: ${root}`);
        return voicings([]);
      }
  
      // find the specific chord type
      const chord = chordGroup.find(c => c.suffix === normalizedSuffix);

      // chords-db has some voicings with wrong notes; hide them rather than
      // show a diagram for a different chord
      const positions = (chord?.positions ?? []).filter(
        position => getNonChordIntervals(position, noteNumber!, suffix).length === 0
      );

      const chordPositions = positions.length
        ? positions
        : findFallbackPositions(chordGroup, noteNumber!, suffix);
      if (!chordPositions.length) {
        console.warn(`No chord positions found for: ${root}${suffix}`);
        return voicings(chordPositions);
      }

      // note numbers start at C = 1
      const bassPitchClass = bassNoteNumber ? (bassNoteNumber - 1) % 12 : undefined;
      if (bassPitchClass === undefined || bassPitchClass === (noteNumber! - 1) % 12) {
        return voicings(chordPositions);
      }

      const slashPositions = findSlashPositions(
        chordGroup, chordPositions, noteNumber!, suffix, bassPitchClass, format
      );
      // with no voicing over the bass note, show the chord without it
      // rather than no diagram
      return slashPositions.length ? voicings(slashPositions) : voicings(chordPositions, true);

    } catch (error) {
      console.error(`Error finding chord positions: ${error instanceof Error ? error.message : error}`);
      return voicings([]);
    }
  };

  const findChordPositions = (
    selectedChord: SelectedChord,
    guitarChords: Record<string, ChordInfo[]>,
    format: string
  ): ChordPosition[] => findChordVoicings(selectedChord, guitarChords, format).positions;

  // bassMissing for each format, chord and slash note asked about; the bass
  // note menus ask for every note on every render
  const slashNoteMissing = new Map<string, boolean>();

  /**
   * Whether no voicing of the chord in the format has the slash note in the
   * bass (see findChordVoicings). False for chords with no voicing at all,
   * which have nothing to show either way.
   */
  const isSlashNoteMissing = (selectedChord: SelectedChord, slashNote: string, format: string): boolean => {
    const key = [format, selectedChord.noteLetter, selectedChord.type, slashNote].join();
    let missing = slashNoteMissing.get(key);
    if (missing === undefined) {
      missing = findChordVoicings(
        { noteLetter: selectedChord.noteLetter, type: selectedChord.type, slash: true, slashNote },
        getInstrumentByFormat(format).chords,
        format
      ).bassMissing;
      slashNoteMissing.set(key, missing);
    }
    return missing;
  };
  
  /**
   * the instrument and tab positions for a chord in a format, with the
   * position that's showing
   */
  const getChordChart = (chordPiano: ChordPiano, format: string) => {
    const instrument = getInstrumentByFormat(format)
    const { positions: tabPositions, bassMissing } = findChordVoicings(
      chordPiano.selectedChord,
      instrument.chords,
      format
    )
    // the stored position can outlive the chord it was picked for (e.g. after
    // changing the root or type), so fall back to the first position
    const storedPosition = chordPiano.selectedChord.position ?? 0
    const position = storedPosition < tabPositions.length ? storedPosition : 0
    // the chord the chart shows: without its slash note when the voicings
    // leave it out, so a name printed with the chart doesn't promise a bass
    // note the shape doesn't have
    const chartChord: SelectedChord = bassMissing
      ? { ...chordPiano.selectedChord, slash: false, slashNote: null }
      : chordPiano.selectedChord
    return { instrument, tabPositions, position, bassMissing, chartChord }
  }

  export { getChordChart, getInstrumentByFormat, findChordPositions, findChordVoicings, isSlashNoteMissing, getNonChordIntervals, isGuitar, parseChordName, normalizeKey, normalizeSuffix };
