import {expect, test} from 'vitest';
import {matrixMult3x3} from './helpers';

test('itentity matrix should return input vector', () => {
  expect(
    matrixMult3x3([1, 0, 0, 0, 1, 0, 0, 0, 1], [5, 835, 92])
  ).toStrictEqual([5, 835, 92]);
});

test('arbitrary matrix and vector', () => {
  expect(
    matrixMult3x3([93, 845, 24, 85, 46, 30, 55, 9, 12], [5, 835, 92])
  ).toStrictEqual([708248, 41595, 8894]);
});

test('matrix.length !=9 sould return null', () => {
  expect(
    matrixMult3x3([93, 845, 24, 85, 46, 30, 55, 9], [5, 835, 92])
  ).toStrictEqual(null);
});

test('vector.length !=3 sould return null', () => {
  expect(
    matrixMult3x3([93, 845, 24, 85, 46, 30, 55, 9, 12], [835, 92])
  ).toStrictEqual(null);
});
