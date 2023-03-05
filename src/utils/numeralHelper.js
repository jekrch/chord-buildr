import { getTransposedNote } from "./transposer"
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

  var numeral = Progression.toRomanNumerals(
      key.noteLetter, 
      [chord.noteLetter]
    )?.[0];

  // if this is a minor chord, convert numeral to lowercase 
  if (isMinorType(chord.type)) {
    return numeral?.toLowerCase();
  } else {
    return numeral;
  }
}

/**
 * Get the key letter for the provided key. If the key is minor, convert it to 
 * the relative major
 * 
 * @param {*} key 
 * @param {*} keyLetter 
 * @returns 
 */
function getMajorKeyLetter(key, keyLetter) {
  if (isMinorType(key.type)) {
    keyLetter = getTransposedNote(key.noteLetter, 3);

  } else {
    keyLetter = key.noteLetter;
  }
  return keyLetter;
}

function isMinorType(type) {
  return type?.includes('m') && !type?.includes('maj') 
}