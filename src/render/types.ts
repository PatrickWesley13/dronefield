export type Ctx = CanvasRenderingContext2D;

export interface PaintOptions {
  readonly time: number;
  readonly reducedMotion: boolean;
}

/** Deterministic per-tile noise so decorations don't flicker between frames. */
export function tileNoise(x: number, y: number, k = 0): number {
  let h = (x * 374761393 + y * 668265263 + k * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
