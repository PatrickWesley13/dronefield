import { ScriptError } from '../errors';
import { MAX_COLLECTION_SIZE } from '../limits';
import { Deferred, Namespace, typeName, type ScriptObject, type Value } from '../values';
import { native } from './helpers';

function expectObject(name: string, v: Value): ScriptObject | Value[] {
  if (v === null || v === undefined || typeof v !== 'object' || v instanceof Namespace)
    throw new ScriptError(`${name}() needs an object. Got ${typeName(v)}.`);
  return v as ScriptObject | Value[];
}

export function createObjectNamespace(): Namespace {
  return new Namespace('Object', {
    keys: native('Object.keys', ([o]) => {
      const t = expectObject('Object.keys', o);
      return Array.isArray(t) ? t.map((_, i) => String(i)) : Object.keys(t);
    }),
    values: native('Object.values', ([o]) => {
      const t = expectObject('Object.values', o);
      return Array.isArray(t) ? t.slice() : Object.keys(t).map((k) => t[k]);
    }),
    entries: native('Object.entries', ([o]) => {
      const t = expectObject('Object.entries', o);
      return Array.isArray(t) ? t.map((v, i) => [String(i), v]) : Object.keys(t).map((k) => [k, t[k]]);
    }),
  });
}

export function createArrayNamespace(): Namespace {
  return new Namespace('Array', {
    isArray: native('Array.isArray', ([v]) => Array.isArray(v)),
    from: native('Array.from', ([source, mapper], ctx) => {
      let items: Value[];
      if (Array.isArray(source)) items = source.slice();
      else if (typeof source === 'string') items = Array.from(source);
      else if (source && typeof source === 'object' && !(source instanceof Namespace) && 'length' in source) {
        const len = (source as ScriptObject).length;
        if (typeof len !== 'number' || !Number.isInteger(len) || len < 0 || len > MAX_COLLECTION_SIZE)
          throw new ScriptError('Array.from() needs a length from 0 to 100,000.');
        items = new Array<Value>(len).fill(undefined);
      } else throw new ScriptError(`Array.from() needs an array, a string or { length: n }. Got ${typeName(source)}.`);
      if (mapper === undefined) return items;
      return new Deferred(
        (function* () {
          const out: Value[] = [];
          for (let i = 0; i < items.length; i++) out.push(yield* ctx.call(mapper, [items[i], i]));
          return out;
        })(),
      );
    }),
  });
}
