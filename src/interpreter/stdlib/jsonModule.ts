import { ScriptError } from '../errors';
import { FORBIDDEN_KEYS } from '../properties';
import { Namespace, NativeFunction, ScriptFunction, createObject, isPrimitive, type Value } from '../values';
import { native } from './helpers';

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

/** Converts a script value to plain JSON data; functions are dropped like in JavaScript. */
function toJson(v: Value, seen = new Set<object>()): Json | undefined {
  if (v instanceof ScriptFunction || v instanceof NativeFunction || v instanceof Namespace) return undefined;
  if (isPrimitive(v)) return v === undefined ? undefined : v;
  if (seen.has(v)) throw new ScriptError('JSON.stringify() found a circular structure.');
  seen.add(v);
  let out: Json;
  if (Array.isArray(v)) out = v.map((x) => toJson(x, seen) ?? null);
  else {
    const o: { [k: string]: Json } = {};
    for (const k of Object.keys(v)) {
      const j = toJson(v[k], seen);
      if (j !== undefined) o[k] = j;
    }
    out = o;
  }
  seen.delete(v);
  return out;
}

/** Rebuilds parsed JSON as null-prototype script objects, dropping prototype keys. */
function fromJson(v: unknown): Value {
  if (Array.isArray(v)) return v.map(fromJson);
  if (v && typeof v === 'object') {
    const o = createObject();
    for (const [k, x] of Object.entries(v)) if (!FORBIDDEN_KEYS.has(k)) o[k] = fromJson(x);
    return o;
  }
  return v as Value;
}

export function createJson(): Namespace {
  return new Namespace('JSON', {
    stringify: native('JSON.stringify', ([value, , indent]) => {
      const space = typeof indent === 'number' ? Math.min(10, indent) : typeof indent === 'string' ? indent.slice(0, 10) : undefined;
      return JSON.stringify(toJson(value), null, space);
    }),
    parse: native('JSON.parse', ([text]) => {
      if (typeof text !== 'string') throw new ScriptError('JSON.parse() needs a string.');
      if (text.length > 1_000_000) throw new ScriptError('That text is too long.');
      try {
        return fromJson(JSON.parse(text));
      } catch (e) {
        throw new ScriptError(`JSON.parse() couldn't read that text: ${(e as Error).message}`);
      }
    }) satisfies NativeFunction,
  });
}
