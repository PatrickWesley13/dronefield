import { ScriptError } from './errors';
import { msg } from '@/shared/message';
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
    throw new ScriptError(
      msg('error.interp.badPropertyName', `Property names must be strings or numbers, not ${typeName(k)}.`, { type: typeName(k) }),
    );
  if (typeof k === 'string' && FORBIDDEN_KEYS.has(k))
    throw new ScriptError(msg('error.interp.forbiddenPropertyName', `'${k}' can't be used as a property name.`, { name: k }));
  return k;
}

const isIndex = (k: PropertyKey): k is number => typeof k === 'number' && Number.isInteger(k) && k >= 0;

export function getProperty(target: Value, key: Value): Value {
  const k = toPropertyKey(key);
  if (Array.isArray(target)) {
    if (k === 'length') return target.length;
    if (isIndex(k)) return target[k];
    if (ARRAY_METHOD_NAMES.has(String(k)))
      throw new ScriptError(msg('error.interp.arrayMethodAsProperty', `${k} is a method. Call it like list.${k}(…).`, { name: k }));
    throw new ScriptError(msg('error.interp.arrayNoProperty', `Arrays don't have a '${k}' property.`, { name: k }));
  }
  if (typeof target === 'string') {
    if (k === 'length') return target.length;
    if (isIndex(k)) return target[k];
    if (STRING_METHOD_NAMES.has(String(k)))
      throw new ScriptError(msg('error.interp.stringMethodAsProperty', `${k} is a method. Call it like text.${k}(…).`, { name: k }));
    throw new ScriptError(msg('error.interp.stringNoProperty', `Strings don't have a '${k}' property.`, { name: k }));
  }
  if (target instanceof Namespace) {
    if (Object.prototype.hasOwnProperty.call(target.members, k)) return target.members[k];
    throw new ScriptError(
      msg('error.interp.namespaceUnavailable', `${target.name}.${k} isn't available in drone scripts.`, {
        namespace: target.name,
        name: k,
      }),
    );
  }
  if (isPlainObject(target)) return Object.prototype.hasOwnProperty.call(target, k) ? target[k] : undefined;
  if (target === null || target === undefined)
    throw new ScriptError(
      msg('error.interp.cannotReadProperty', `Cannot read properties of ${typeName(target)} (reading '${k}').`, {
        type: typeName(target),
        key: String(k),
      }),
    );
  throw new ScriptError(
    msg('error.interp.cantReadProperty', `Can't read '${k}' of ${typeName(target)}.`, { name: k, type: typeName(target) }),
  );
}

export function setProperty(target: Value, key: Value, value: Value): void {
  const k = toPropertyKey(key);
  if (Array.isArray(target)) {
    if (!isIndex(k))
      throw new ScriptError(
        msg('error.interp.arrayPositionInvalid', `Array positions must be whole numbers from 0, not ${formatValue(k, true)}.`, {
          value: formatValue(k, true),
        }),
      );
    if (k >= MAX_COLLECTION_SIZE)
      throw new ScriptError(
        msg('error.interp.arrayTooLarge', `Arrays can hold at most ${MAX_COLLECTION_SIZE} items.`, { max: MAX_COLLECTION_SIZE }),
      );
    while (target.length < k) target.push(undefined);
    target[k] = value;
    return;
  }
  if (isPlainObject(target)) {
    if (!(k in target) && Object.keys(target).length >= MAX_COLLECTION_SIZE)
      throw new ScriptError(msg('error.interp.objectTooLarge', 'That object is too large.'));
    target[String(k)] = value;
    return;
  }
  throw new ScriptError(
    msg('error.interp.cantSetProperty', `Can't set '${k}' on ${typeName(target)}.`, { name: k, type: typeName(target) }),
  );
}
