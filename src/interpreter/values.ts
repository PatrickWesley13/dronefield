import type * as AST from 'acorn';
import type { Execution } from './signals';
import type { Scope } from './scope';

export type Primitive = undefined | null | boolean | number | string;
/** Script objects are created with a null prototype so player code can't reach Object.prototype. */
export interface ScriptObject {
  [key: string]: Value;
}
export type Callable = ScriptFunction | NativeFunction;
export type Value = Primitive | Value[] | ScriptObject | Callable | Namespace;

export class ScriptFunction {
  constructor(
    public name: string,
    readonly params: readonly AST.Pattern[],
    readonly body: AST.BlockStatement | AST.Expression,
    readonly closure: Scope,
  ) {}
}

/** Lets a native function call back into player code (e.g. Array.from with a mapper). */
export interface NativeContext {
  call(fn: Value, args: Value[]): Execution<Value>;
}

/** A native result that needs to run player code before it can produce a value. */
export class Deferred {
  constructor(readonly execution: Execution<Value>) {}
}

export type NativeImpl = (args: Value[], ctx: NativeContext) => Value | Deferred;

export interface NativeOptions {
  /** Actions take game time; the runner animates and evaluates objectives after each one. */
  readonly isAction?: boolean;
}

export class NativeFunction {
  constructor(
    readonly name: string,
    readonly impl: NativeImpl,
    readonly options: NativeOptions = {},
  ) {}
  get isAction(): boolean {
    return !!this.options.isAction;
  }
}

/** A read-only bag of members such as Math or console, optionally callable (Number, String). */
export class Namespace {
  constructor(
    readonly name: string,
    readonly members: Readonly<Record<string, Value>>,
    readonly callable: NativeFunction | null = null,
  ) {}
}

export function createObject(entries?: Record<string, Value>): ScriptObject {
  const o = Object.create(null) as ScriptObject;
  if (entries) for (const k of Object.keys(entries)) o[k] = entries[k];
  return o;
}

export function isCallable(v: unknown): v is Callable | Namespace {
  return v instanceof ScriptFunction || v instanceof NativeFunction || (v instanceof Namespace && v.callable !== null);
}

export function isPlainObject(v: unknown): v is ScriptObject {
  return v !== null && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === null;
}

export function isPrimitive(v: unknown): v is Primitive {
  return v === null || v === undefined || (typeof v !== 'object' && typeof v !== 'function');
}

export function typeName(v: Value): string {
  if (v === undefined) return 'undefined';
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (isCallable(v)) return 'function';
  if (typeof v === 'object') return 'object';
  return typeof v;
}

export function isTruthy(v: Value): boolean {
  return !(v === null || v === undefined || v === false || v === 0 || v === '' || Number.isNaN(v));
}
