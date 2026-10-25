import type { Message } from '@/shared/message';

/**
 * A problem in the player's program, reported with the line it happened on.
 * `message.fallback` is the English text; the UI shows the translated form.
 */
export class ScriptError extends Error {
  readonly message_: Message;

  constructor(
    message: string | Message,
    public line: number | null = null,
  ) {
    const m: Message = typeof message === 'string' ? { key: 'error.text', params: { text: message }, fallback: message } : message;
    super(m.fallback);
    this.message_ = m;
    this.name = 'ScriptError';
  }
}

export function isScriptError(e: unknown): e is ScriptError {
  return e instanceof ScriptError;
}
