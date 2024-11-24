import { expect, it } from 'vitest';
import {getChordNumeral} from './numeralHelper';

it('getChordNumeral: returns a numeral for the provided chord in the provided key', () => {

  expect(
    getChordNumeral(
      getChord("C"), 
      getChord("F")
    )
  ).toEqual("IV");

  expect(
    getChordNumeral(
      getChord("A", "m9"), 
      getChord("D")
    )
  ).toEqual("IV");

  // represent minor chord with lowercase numeral
  expect(
    getChordNumeral(
      getChord("G", "m9"), 
      getChord("F#", "m7#5")
    )
  ).toEqual("vii");

  // if no key is provided, return undefined
  expect(
    getChordNumeral(
      undefined, 
      getChord("F#", "m7#5")
    )
  ).toBeUndefined();

  // if we're in a minor key, the third should be flat
  expect(
    getChordNumeral(
      getChord("A", "m"), 
      getChord("C", "m7#5")
    )
  ).toEqual("iii");

});

function getChord(letter: string, type?: string) {
  return {
    noteLetter: letter,
    type: type
  }
}