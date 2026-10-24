import { ScriptError } from './errors';
import { formatValue } from './format';
import { MAX_COLLECTION_SIZE } from './limits';
import { ARRAY_METHOD_NAMES } from './methods/arrayMethods';
import { STRING_METHOD_NAMES } from './methods/stringMethods';
import { Namespace, isPlainObject, typeName, type Value } from './values';

/** Keys that lead to prototypes or engine internals. Never readable or writable. */
export const FORBIDDEN_KEYS: ReadonlySet<string> = new Set([
  '__proto__',
  'constructor',
  'prototype',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
]);

export type PropertyKey = string | number;

export function toPropertyKey(k: Value): PropertyKey {
  if (typeof k !== 'string' && typeof k !== 'number')
    throw new ScriptError(`Property names must be strings or numbers, not ${typeName(k)}.`);
  if (typeof k === 'string' && FORBIDDEN_KEYS.has(k)) throw new ScriptError(`'${k}' can't be used as a property name.`);
  return k;
}

const isIndex = (k: PropertyKey): k is number => typeof k === 'number' && Number.isInteger(k) && k >= 0;

export function getProperty(target: Value, key: Value): Value {
  const k = toPropertyKey(key);
  if (Array.isArray(target)) {
    if (k === 'length') return target.length;
    if (isIndex(k)) return target[k];
    if (ARRAY_METHOD_NAMES.has(String(k))) throw new ScriptError(`${k} is a method. Call it like list.${k}(…).`);
    throw new ScriptError(`Arrays don't have a '${k}' property.`);
  }
  if (typeof target === 'string') {
    if (k === 'length') return target.length;
    if (isIndex(k)) return target[k];
    if (STRING_METHOD_NAMES.has(String(k))) throw new ScriptError(`${k} is a method. Call it like text.${k}(…).`);
    throw new ScriptError(`Strings don't have a '${k}' property.`);
  }
  if (target instanceof Namespace) {
    if (Object.prototype.hasOwnProperty.call(target.members, k)) return target.members[k];
    throw new ScriptError(`${target.name}.${k} isn't available in drone scripts.`);
  }
  if (isPlainObject(target)) return Object.prototype.hasOwnProperty.call(target, k) ? target[k] : undefined;
  if (target === null || target === undefined) throw new ScriptError(`Cannot read properties of ${typeName(target)} (reading '${k}').`);
  throw new ScriptError(`Can't read '${k}' of ${typeName(target)}.`);
}

export function setProperty(target: Value, key: Value, value: Value): void {
  const k = toPropertyKey(key);
  if (Array.isArray(target)) {
    if (!isIndex(k)) throw new ScriptError(`Array positions must be whole numbers from 0, not ${formatValue(k, true)}.`);
    if (k >= MAX_COLLECTION_SIZE) throw new ScriptError(`Arrays can hold at most ${MAX_COLLECTION_SIZE} items.`);
    while (target.length < k) target.push(undefined);
    target[k] = value;
    return;
  }
  if (isPlainObject(target)) {
    if (!(k in target) && Object.keys(target).length >= MAX_COLLECTION_SIZE) throw new ScriptError('That object is too large.');
    target[String(k)] = value;
    return;
  }
  throw new ScriptError(`Can't set '${k}' on ${typeName(target)}.`);
}
