import { ScriptError } from '../errors';
import { toDisplayString } from '../format';
import { MAX_COLLECTION_SIZE } from '../limits';
import { expectNumber } from '../operators';
import type { Value } from '../values';
import type { Method } from './types';

const str = (args: Value[], i: number): string => toDisplayString(args[i]);
const optional = (name: string, v: Value): number | undefined => (v === undefined ? undefined : expectNumber(name, v));
function bounded(s: string): string {
  if (s.length > MAX_COLLECTION_SIZE) throw new ScriptError('That string would be too long.');
  return s;
}

/* eslint-disable require-yield */
export const STRING_METHODS: Readonly<Record<string, Method<string>>> = {
  *includes(s, a) {
    return s.includes(str(a, 0));
  },
  *indexOf(s, a) {
    return s.indexOf(str(a, 0));
  },
  *startsWith(s, a) {
    return s.startsWith(str(a, 0));
  },
  *endsWith(s, a) {
    return s.endsWith(str(a, 0));
  },
  *toUpperCase(s) {
    return s.toUpperCase();
  },
  *toLowerCase(s) {
    return s.toLowerCase();
  },
  *trim(s) {
    return s.trim();
  },
  *at(s, a) {
    return s.at(expectNumber('at', a[0]));
  },
  *charAt(s, a) {
    return s.charAt(a.length ? expectNumber('charAt', a[0]) : 0);
  },
  *slice(s, a) {
    return s.slice(optional('slice', a[0]), optional('slice', a[1]));
  },
  *split(s, a) {
    return a.length ? s.split(str(a, 0)).slice(0, MAX_COLLECTION_SIZE) : [s];
  },
  *replaceAll(s, a) {
    return bounded(s.split(str(a, 0)).join(str(a, 1)));
  },
  *repeat(s, a) {
    const n = expectNumber('repeat', a[0]);
    if (n < 0) throw new ScriptError('repeat() needs a count of 0 or more.');
    return bounded(s.repeat(Math.min(n, MAX_COLLECTION_SIZE)));
  },
  *padStart(s, a) {
    return s.padStart(Math.min(expectNumber('padStart', a[0]), 10_000), a.length > 1 ? str(a, 1) : ' ');
  },
  *padEnd(s, a) {
    return s.padEnd(Math.min(expectNumber('padEnd', a[0]), 10_000), a.length > 1 ? str(a, 1) : ' ');
  },
};
/* eslint-enable require-yield */

export const STRING_METHOD_NAMES: ReadonlySet<string> = new Set(Object.keys(STRING_METHODS));
