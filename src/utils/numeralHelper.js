import { getTransposedNote } from "./transposer"
import * as Progression from "@tonaljs/progression"

/**
 * Returns the roman numeral representation of the provided chord within the 
 * provided key. If the key is minor, it is converted to the relative major
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

  // If this chord just is the root, return I. This saves us 
  // the complication of determining the number in the case where 
  // we're converting from a minor to a major scale
  if (key.noteLetter === chord.noteLetter) {
    return "I"
  }

  var keyLetter = getMajorKeyLetter(key, keyLetter);

  var romanNumerals = Progression.toRomanNumerals(keyLetter, [chord.noteLetter]);

  return romanNumerals?.[0]
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
  if (typeIsMinor(key.type)) {
    keyLetter = getTransposedNote(key.noteLetter, 3);

  } else {
    keyLetter = key.noteLetter;
  }
  return keyLetter;
}

function typeIsMinor(type) {
  return type?.includes('m') && !type?.includes('maj') 
}