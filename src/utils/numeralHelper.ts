import { getScaleAdjustedNoteLetter, isMinorType } from "./chordManager";
import * as Progression from "@tonaljs/progression";
import { SelectedChord } from "./chordPianoHandler";

/**
 * Returns the roman numeral representation of the provided chord within the 
 * provided key.
 * 
 * @param key - the musical key context
 * @param chord - the chord to analyze
 * @returns the roman numeral representation of the chord
 */
export function getChordNumeral(
  key: SelectedChord | null | undefined,
  chord?: SelectedChord
): string | undefined {
  
  // if no key is currently selected, skip
  if (!key || !chord) {
    return;
  }

  if (key.noteLetter === chord.noteLetter) {
    return "I";
  }

  const chordLetter = getScaleAdjustedNoteLetter(key, chord.noteLetter!);

  let numeral: string | undefined = Progression.toRomanNumerals(
    key.noteLetter!,
    [chordLetter]
  )?.[0];

  if (isMinorType(key.type)) {
    numeral = convertNumeralForMinorKey(numeral);
  }

  // if this is a minor chord, convert numeral to lowercase 
  if (isMinorType(chord.type)) {
    return numeral?.toLowerCase();
  }
  
  return numeral;
}

/***
 * The numerals are initially generated under the assumption that 
 * we're in a major key. This is used to convert the numeral if we're 
 * in a minor key instead. 
 * 
 * In a minor key we need to flat the third. That means bIII should 
 * become III. So in the key of Am, III will C, not C#.  
 */
function convertNumeralForMinorKey(numeral: string | undefined): string | undefined {
  if (!numeral) {
    return numeral;
  }

  switch (numeral) {
    case 'bIII':
      return 'III';
    case 'III':
      return '#III';
    case '#II':
      return 'III';
    default:
      return numeral;
  }
}