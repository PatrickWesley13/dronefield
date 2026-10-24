import type { Execution } from '../signals';
import type { Value } from '../values';

export interface MethodContext {
  call(fn: Value, args: Value[]): Execution<Value>;
}

/** Built-in methods are generators so they can call player callbacks step by step. */
export type Method<T> = (target: T, args: Value[], ctx: MethodContext) => Execution<Value>;
