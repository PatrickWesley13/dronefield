import { CROPS, isCropId, type CropId } from '@/domain/crops';
import { isDirection, type Direction } from '@/domain/geometry';
import type { Farm } from '@/domain/farm';
import { ScriptError, formatValue, type Value } from '@/interpreter';

export function requireArity(name: string, args: readonly Value[], min: number, max: number): void {
  if (args.length < min) throw new ScriptError(`${name}() needs ${min} argument${min > 1 ? 's' : ''}.`);
  if (args.length > max) {
    throw new ScriptError(
      `${name}() takes ${max === 0 ? 'no arguments' : `at most ${max} argument${max > 1 ? 's' : ''}`}, but got ${args.length}.`,
    );
  }
}

export function requireDirection(name: string, v: Value): Direction {
  if (isDirection(v)) return v;
  const hint = typeof v === 'string' && isDirection(v.toLowerCase()) ? ` Directions are lowercase: "${v.toLowerCase()}".` : '';
  throw new ScriptError(`${name}() needs a direction: "north", "south", "east" or "west". Got ${formatValue(v, true)}.${hint}`);
}

export function requireCrop(name: string, v: Value, farm: Farm | null): CropId {
  if (!isCropId(v)) throw new ScriptError(`${name}() needs a crop name like "wheat". Got ${formatValue(v, true)}.`);
  if (farm && !farm.unlockedCrops.has(v)) throw new ScriptError(`${CROPS[v].label} seeds aren't unlocked yet.`);
  return v;
}

export const describePosition = (farm: Farm): string => `(${farm.drone.x}, ${farm.drone.y})`;
