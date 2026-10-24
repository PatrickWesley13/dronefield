import { ScriptError } from '../errors';
import { toDisplayString } from '../format';
import { MAX_COLLECTION_SIZE } from '../limits';
import { expectNumber } from '../operators';
import { isCallable, isTruthy, type Value } from '../values';
import type { Execution } from '../signals';
import type { Method, MethodContext } from './types';

function callbackArg(name: string, args: Value[]): Value {
  const f = args[0];
  if (!isCallable(f)) throw new ScriptError(`${name}() needs a function, like list.${name}(x => …).`);
  return f;
}
function ensureRoom(arr: Value[], extra: number): void {
  if (arr.length + extra > MAX_COLLECTION_SIZE) throw new ScriptError(`Arrays can hold at most ${MAX_COLLECTION_SIZE} items.`);
}
function optionalIndex(name: string, v: Value): number | undefined {
  return v === undefined ? undefined : expectNumber(name, v);
}

function* compare(ctx: MethodContext, fn: Value | null, a: Value, b: Value): Execution<number> {
  if (fn) {
    const r = yield* ctx.call(fn, [a, b]);
    if (typeof r !== 'number') throw new ScriptError('The sort() compare function must return a number.');
    return r;
  }
  const x = toDisplayString(a),
    y = toDisplayString(b);
  return x < y ? -1 : x > y ? 1 : 0;
}

/* eslint-disable require-yield */
export const ARRAY_METHODS: Readonly<Record<string, Method<Value[]>>> = {
  *push(a, args) {
    ensureRoom(a, args.length);
    a.push(...args);
    return a.length;
  },
  *unshift(a, args) {
    ensureRoom(a, args.length);
    a.unshift(...args);
    return a.length;
  },
  *pop(a) {
    return a.pop();
  },
  *shift(a) {
    return a.shift();
  },
  *at(a, args) {
    return a.at(expectNumber('at', args[0]));
  },
  *includes(a, args) {
    return a.includes(args[0]);
  },
  *indexOf(a, args) {
    return a.indexOf(args[0]);
  },
  *lastIndexOf(a, args) {
    return a.lastIndexOf(args[0]);
  },
  *join(a, args) {
    return a.map(toDisplayString).join(args[0] === undefined ? ',' : toDisplayString(args[0]));
  },
  *slice(a, args) {
    return a.slice(optionalIndex('slice', args[0]), optionalIndex('slice', args[1]));
  },
  *reverse(a) {
    return a.reverse();
  },
  *fill(a, args) {
    return a.fill(args[0]);
  },
  *concat(a, args) {
    const r = a.slice();
    for (const x of args) {
      if (Array.isArray(x)) r.push(...x);
      else r.push(x);
    }
    ensureRoom([], r.length);
    return r;
  },
  *forEach(a, args, ctx) {
    const f = callbackArg('forEach', args);
    for (let i = 0; i < a.length; i++) yield* ctx.call(f, [a[i], i, a]);
    return undefined;
  },
  *map(a, args, ctx) {
    const f = callbackArg('map', args);
    const r: Value[] = [];
    for (let i = 0; i < a.length; i++) r.push(yield* ctx.call(f, [a[i], i, a]));
    return r;
  },
  *filter(a, args, ctx) {
    const f = callbackArg('filter', args);
    const r: Value[] = [];
    for (let i = 0; i < a.length; i++) if (isTruthy(yield* ctx.call(f, [a[i], i, a]))) r.push(a[i]);
    return r;
  },
  *some(a, args, ctx) {
    const f = callbackArg('some', args);
    for (let i = 0; i < a.length; i++) if (isTruthy(yield* ctx.call(f, [a[i], i, a]))) return true;
    return false;
  },
  *every(a, args, ctx) {
    const f = callbackArg('every', args);
    for (let i = 0; i < a.length; i++) if (!isTruthy(yield* ctx.call(f, [a[i], i, a]))) return false;
    return true;
  },
  *find(a, args, ctx) {
    const f = callbackArg('find', args);
    for (let i = 0; i < a.length; i++) if (isTruthy(yield* ctx.call(f, [a[i], i, a]))) return a[i];
    return undefined;
  },
  *findIndex(a, args, ctx) {
    const f = callbackArg('findIndex', args);
    for (let i = 0; i < a.length; i++) if (isTruthy(yield* ctx.call(f, [a[i], i, a]))) return i;
    return -1;
  },
  *reduce(a, args, ctx) {
    const f = callbackArg('reduce', args);
    let i = 0;
    let acc: Value;
    if (args.length > 1) acc = args[1];
    else {
      if (!a.length) throw new ScriptError('reduce() of an empty array needs a starting value.');
      acc = a[0];
      i = 1;
    }
    for (; i < a.length; i++) acc = yield* ctx.call(f, [acc, a[i], i, a]);
    return acc;
  },
  /** Stable merge sort that can call a player-written compare function. */
  *sort(a, args, ctx) {
    const fn = args.length ? callbackArg('sort', args) : null;
    let items = a.slice();
    for (let width = 1; width < items.length; width *= 2) {
      const merged: Value[] = [];
      for (let lo = 0; lo < items.length; lo += 2 * width) {
        const mid = Math.min(lo + width, items.length),
          hi = Math.min(lo + 2 * width, items.length);
        let i = lo,
          j = mid;
        while (i < mid && j < hi) merged.push((yield* compare(ctx, fn, items[i], items[j])) <= 0 ? items[i++] : items[j++]);
        while (i < mid) merged.push(items[i++]);
        while (j < hi) merged.push(items[j++]);
      }
      items = merged;
    }
    items.forEach((v, i) => (a[i] = v));
    return a;
  },
};
/* eslint-enable require-yield */

export const ARRAY_METHOD_NAMES: ReadonlySet<string> = new Set(Object.keys(ARRAY_METHODS));
