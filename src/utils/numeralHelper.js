import { getScaleAdjustedChordLetter, isMinorType } from "./chordManager"
import * as Progression from "@tonaljs/progression"

/**
 * Returns the roman numeral representation of the provided chord within the 
 * provided key.
 * 
 * @param {} key 
 * @param {*} chord 
 * @returns 
 */
export function getChordNumeral(key, chord) {
 
  // if no key is currently selected, skip
  if (!key) {
    return;
  }

  if (key.noteLetter === chord.noteLetter) {
    return "I";
  }

  let chordLetter = getScaleAdjustedChordLetter(key, chord.noteLetter);

  var numeral = Progression.toRomanNumerals(
      key.noteLetter, 
      [chordLetter]
    )?.[0];

  if (isMinorType(key.type)) {
    numeral = convertNumeralForMinorKey(numeral);
  }

  // if this is a minor chord, convert numeral to lowercase 
  if (isMinorType(chord.type)) {
    return numeral?.toLowerCase();
  } else {
    return numeral;
  }
}



/***
 * The numerals are initially generated under the assumption that 
 * we're in a major key. This is used to convert the numeral if we're 
 * in a minor key instead. 
 * 
 * In a minor key we need to flat the third. That means bIII should 
 * become III. So in the key of Am, III will C, not C#.  
 */
function convertNumeralForMinorKey(numeral) {
  if (numeral === 'bIII') {
    numeral = 'III';
  } else if (numeral === 'III') {
    numeral = '#III';
  } else if (numeral === '#II') {
    numeral = 'III';
  }
  return numeral;
}
