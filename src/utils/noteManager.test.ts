import { expect, it } from 'vitest';
import {formatNoteName, getNoteNumber, getNoteLetter} from './noteManager';


it('formatNoteName: Format note letters to proper case', () => {

  expect(formatNoteName('bB')).toEqual('Bb');
  expect(formatNoteName('b')).toEqual('B');
  expect(formatNoteName('C#')).toEqual('C#');

});


it('getNoteNumber: Get note number by letter', () => {

  expect(getNoteNumber('bB')).toEqual(11);
  expect(getNoteNumber('C')).toEqual(1);
  expect(getNoteNumber('d#')).toEqual(4);
  expect(getNoteNumber('EB')).toEqual(4);
  expect(getNoteNumber('f#')).toEqual(7);
  expect(getNoteNumber('g')).toEqual(8);
  
});


it('getNoteLetter: Get note letter taking key into consideration', () => {

  expect(getNoteLetter('A', 2)).toEqual('C#');
  expect(getNoteLetter('Db', 2)).toEqual('Db');
  expect(getNoteLetter('G', 7)).toEqual('F#');

});