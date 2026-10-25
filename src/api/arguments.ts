import { CROPS, isCropId, type CropId } from '@/domain/crops';
import { isDirection, type Direction } from '@/domain/geometry';
import type { Farm } from '@/domain/farm';
import { ScriptError, formatValue, type Value } from '@/interpreter';
import { msg } from '@/shared/message';

export function requireArity(name: string, args: readonly Value[], min: number, max: number): void {
  if (args.length < min)
    throw new ScriptError(
      min > 1
        ? msg('error.api.needsArgs', '{name}() needs {count} arguments.', { name, count: min })
        : msg('error.api.needsArg', '{name}() needs {count} argument.', { name, count: min }),
    );
  if (args.length > max) {
    const got = args.length;
    throw new ScriptError(
      max === 0
        ? msg('error.api.takesNoArgs', '{name}() takes no arguments, but got {got}.', { name, got })
        : max > 1
          ? msg('error.api.takesAtMostArgs', '{name}() takes at most {max} arguments, but got {got}.', { name, max, got })
          : msg('error.api.takesAtMostArg', '{name}() takes at most {max} argument, but got {got}.', { name, max, got }),
    );
  }
}

export function requireDirection(name: string, v: Value): Direction {
  if (isDirection(v)) return v;
  const got = formatValue(v, true);
  if (typeof v === 'string' && isDirection(v.toLowerCase())) {
    throw new ScriptError(
      msg(
        'error.api.needsDirectionLowercase',
        '{name}() needs a direction: "north", "south", "east" or "west". Got {got}. Directions are lowercase: "{lower}".',
        { name, got, lower: v.toLowerCase() },
      ),
    );
  }
  throw new ScriptError(
    msg('error.api.needsDirection', '{name}() needs a direction: "north", "south", "east" or "west". Got {got}.', { name, got }),
  );
}

export function requireCrop(name: string, v: Value, farm: Farm | null): CropId {
  if (!isCropId(v))
    throw new ScriptError(
      msg('error.api.needsCrop', '{name}() needs a crop name like "wheat". Got {got}.', { name, got: formatValue(v, true) }),
    );
  if (farm && !farm.unlockedCrops.has(v))
    throw new ScriptError(msg('error.api.cropLocked', "{label} seeds aren't unlocked yet.", { label: CROPS[v].label }));
  return v;
}

export const describePosition = (farm: Farm): string => `(${farm.drone.x}, ${farm.drone.y})`;
