/** What the interpreter yields to whoever is driving it. */
export type ExecutionSignal =
  | { readonly kind: 'step'; readonly line: number }
  | { readonly kind: 'action'; readonly name: string; readonly line: number };

export type Execution<T> = Generator<ExecutionSignal, T, void>;

/**
 * Wraps an immediate value as an execution, for handlers that need no steps.
 * (A generator without yield is intentional here.)
 */
// eslint-disable-next-line require-yield
export function* immediate<T>(value: T): Execution<T> {
  return value;
}
