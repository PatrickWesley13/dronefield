/** A message the UI translates at render time. `fallback` is the English text. */
export interface Message {
  readonly key: string;
  readonly params?: Readonly<Record<string, string | number>>;
  readonly fallback: string;
}

export function msg(key: string, fallback: string, params?: Message['params']): Message {
  return params ? { key, params, fallback } : { key, fallback };
}
