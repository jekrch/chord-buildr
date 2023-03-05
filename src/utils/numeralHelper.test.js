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
});

function getChord(letter, type) {
  return {
    noteLetter: letter,
    type: type
  }
}