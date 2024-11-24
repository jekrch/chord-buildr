import { expect, it } from 'vitest';
import {shiftChord} from './transposer';

it('shiftChord: returns transposed chord note numbers', () => {

  expect(shiftChord(0, 1, [0,4,7])).toEqual([1,5,8]);
  expect(shiftChord(4, 3, [0,4,7])).toEqual([11,15,18]);
  expect(shiftChord(4, 3, [1,5,8])).toEqual([0,4,7]);
  expect(shiftChord(4, 5, [1,5,8])).toEqual([2,6,9]);
  expect(shiftChord(4, 6, [0,11,24])).toEqual([2,1,14]);

});