/** A message the UI translates at render time. `fallback` is the English text. */
export interface Message {
  readonly key: string;
  readonly params?: Readonly<Record<string, string | number>>;
  readonly fallback: string;
}

/**
 * Builds a message. When `params` are given, `{name}` placeholders in `fallback`
 * are filled in, so the English text is always readable (e.g. in tests and logs).
 * Placeholders with no matching param are left as they are.
 */
export function msg(key: string, fallback: string, params?: Message['params']): Message {
  if (!params) return { key, fallback };
  const filled = fallback.replace(/\{(\w+)\}/g, (whole, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : whole,
  );
  return { key, params, fallback: filled };
}
