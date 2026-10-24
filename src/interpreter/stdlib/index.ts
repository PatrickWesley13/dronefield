import type { Value } from '../values';
import { createArrayNamespace, createObjectNamespace } from './collectionsModule';
import { createConsole } from './consoleModule';
import { createConversions } from './conversionsModule';
import { createJson } from './jsonModule';
import { createMath } from './mathModule';
import type { Bindings, StandardLibraryOptions } from './types';

export type { ConsoleLevel, ScriptConsole, StandardLibraryOptions, Bindings } from './types';

/** The JavaScript built-ins available to every drone script. Add a module here to extend it. */
export function createStandardLibrary(options: StandardLibraryOptions): Bindings {
  const entries: Array<[string, Value]> = [
    ['console', createConsole(options.console)],
    ['Math', createMath(options.randomSeed)],
    ['Object', createObjectNamespace()],
    ['Array', createArrayNamespace()],
    ['JSON', createJson()],
    ...createConversions(),
  ];
  return new Map(entries);
}

/** Member names of the namespaces above, for editor autocomplete. */
export const STANDARD_MEMBERS: Readonly<Record<string, readonly string[]>> = {
  console: ['log', 'info', 'warn', 'error', 'clear'],
  Math: ['floor', 'ceil', 'round', 'trunc', 'abs', 'min', 'max', 'sqrt', 'pow', 'sign', 'random', 'PI'],
  Object: ['keys', 'values', 'entries'],
  Array: ['isArray', 'from'],
  JSON: ['stringify', 'parse'],
  Number: ['isInteger', 'isFinite', 'isNaN', 'MAX_SAFE_INTEGER'],
};
export const STANDARD_GLOBALS: readonly string[] = [
  'console',
  'Math',
  'Object',
  'Array',
  'JSON',
  'Number',
  'String',
  'Boolean',
  'parseInt',
  'parseFloat',
  'isNaN',
  'isFinite',
];
