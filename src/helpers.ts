export function matrixMult3x3(
  matrix: number[],
  vector: number[]
): number[] | null {
  if (matrix.length !== 9 || vector.length !== 3) return null;
  const retVec: number[] = [];
  for (let i = 0; i < 3; i++) {
    retVec.push(0);
    for (let j = 0; j < 3; j++) {
      retVec[i] += matrix[i * 3 + j] * vector[j];
    }
  }
  return retVec;
}
