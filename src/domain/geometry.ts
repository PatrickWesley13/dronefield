export type Direction = 'north' | 'east' | 'south' | 'west';

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** x grows to the east, y grows to the north; (0, 0) is the south-west corner. */
export const DIRECTION_VECTORS: Readonly<Record<Direction, Point>> = {
  north: { x: 0, y: 1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: -1 },
  west: { x: -1, y: 0 },
};

export const DIRECTIONS = Object.keys(DIRECTION_VECTORS) as Direction[];

export function isDirection(value: unknown): value is Direction {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(DIRECTION_VECTORS, value);
}

export function step(from: Point, direction: Direction): Point {
  const v = DIRECTION_VECTORS[direction];
  return { x: from.x + v.x, y: from.y + v.y };
}
