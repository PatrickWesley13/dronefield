import type { Value } from '../values';

export type ConsoleLevel = 'log' | 'info' | 'warn' | 'error';

/** Where console.* output goes. The UI and tests provide their own. */
export interface ScriptConsole {
  write(level: ConsoleLevel, text: string): void;
  clear(): void;
}

export interface StandardLibraryOptions {
  readonly console: ScriptConsole;
  /** Seed for Math.random so runs are reproducible. */
  readonly randomSeed: number;
}

export type Bindings = ReadonlyMap<string, Value>;
