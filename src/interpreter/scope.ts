import { ScriptError } from './errors';
import { msg } from '@/shared/message';
import type { Value } from './values';

export class Scope {
  private readonly vars = new Map<string, Value>();
  private readonly constants = new Set<string>();

  constructor(
    readonly parent: Scope | null,
    /** Names that are built in to the game rather than declared by the player. */
    private readonly builtins: ReadonlySet<string> = new Set(),
  ) {}

  declare(name: string, value: Value, isConst: boolean): void {
    if (this.vars.has(name)) {
      if (this.builtins.has(name))
        throw new ScriptError(
          msg('error.interp.builtinRedeclared', `${name} is a built-in name and can't be redeclared. Pick another name.`, { name }),
        );
      throw new ScriptError(msg('error.interp.alreadyDeclared', `'${name}' is already declared in this block.`, { name }));
    }
    this.vars.set(name, value);
    if (isConst) this.constants.add(name);
  }

  find(name: string): Scope | null {
    if (this.vars.has(name)) return this;
    return this.parent ? this.parent.find(name) : null;
  }

  get(name: string): Value {
    return this.vars.get(name);
  }

  set(name: string, value: Value): void {
    if (this.builtins.has(name))
      throw new ScriptError(msg('error.interp.builtinReassigned', `${name} is built in and can't be reassigned.`, { name }));
    if (this.constants.has(name))
      throw new ScriptError(
        msg('error.interp.constReassigned', `'${name}' is a const and can't change. Declare it with let instead.`, { name }),
      );
    this.vars.set(name, value);
  }
}
