/**
 * Rounds a finite number the way Python's `round` does, with halves moving
 * toward the nearest even integer.
 *
 * @param value - Finite number to round.
 * @returns The rounded integer.
 */
export function pythonRound(value: number): number {
  const floor = Math.floor(value);
  const fraction = value - floor;
  if (fraction > 0.5) {
    return floor + 1;
  }
  if (fraction < 0.5) {
    return floor;
  }
  return floor % 2 === 0 ? floor : floor + 1;
}
