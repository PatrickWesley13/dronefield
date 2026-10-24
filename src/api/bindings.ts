import { NativeFunction, type Value } from '@/interpreter';
import { requireArity } from './arguments';
import { DRONE_API } from './registry';
import type { ApiContext } from './types';

export interface ApiBindings {
  readonly globals: ReadonlyMap<string, Value>;
  readonly locked: ReadonlyMap<string, string>;
}

/**
 * Exposes the unlocked drone functions to a script. Locked functions are not
 * bound at all, so the interpreter enforces unlocks rather than the UI.
 */
export function createApiBindings(ctx: ApiContext, unlocked: ReadonlySet<string>, unlockHint: (name: string) => string): ApiBindings {
  const globals = new Map<string, Value>();
  const locked = new Map<string, string>();
  for (const fn of DRONE_API) {
    if (!unlocked.has(fn.name)) {
      locked.set(fn.name, unlockHint(fn.name));
      continue;
    }
    globals.set(
      fn.name,
      new NativeFunction(
        fn.name,
        (args) => {
          requireArity(fn.name, args, fn.minArgs, fn.maxArgs);
          return fn.invoke(ctx, args);
        },
        { isAction: fn.isAction },
      ),
    );
  }
  return { globals, locked };
}
