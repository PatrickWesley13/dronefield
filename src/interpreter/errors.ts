/** A problem in the player's program, reported with the line it happened on. */
export class ScriptError extends Error {
  constructor(
    message: string,
    public line: number | null = null,
  ) {
    super(message);
    this.name = 'ScriptError';
  }
}

export function isScriptError(e: unknown): e is ScriptError {
  return e instanceof ScriptError;
}
