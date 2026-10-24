import { ScriptError } from '../errors';
import { NativeFunction, isPrimitive, typeName, type NativeImpl, type Value } from '../values';

export const native = (name: string, impl: NativeImpl): NativeFunction => new NativeFunction(name, impl);

/** A native function whose arguments must all be numbers. */
export function numeric(name: string, fn: (...n: number[]) => number): NativeFunction {
  return native(name, (args) => {
    for (const v of args) if (typeof v !== 'number') throw new ScriptError(`${name}() needs numbers. Got ${typeName(v)}.`);
    return fn(...(args as number[]));
  });
}

/** A native conversion function that only accepts primitive values. */
export function primitiveOnly(name: string, fn: (args: Value[]) => Value): NativeFunction {
  return native(name, (args) => {
    if (args.length && !isPrimitive(args[0]))
      throw new ScriptError(`${name}() works on numbers, strings and booleans. Got ${typeName(args[0])}.`);
    return fn(args);
  });
}

/** Small, fast, seedable PRNG (mulberry32). */
export function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
