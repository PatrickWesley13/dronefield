import { Namespace, ScriptFunction, NativeFunction, type Value } from './values';

const IDENT = /^[A-Za-z_$][\w$]*$/;
const quote = (s: string): string => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";

/** Node.js-style rendering used by console.log and error messages. */
export function formatValue(v: Value, nested = false, depth = 0): string {
  if (v === undefined) return 'undefined';
  if (v === null) return 'null';
  if (typeof v === 'string') return nested ? quote(v) : v;
  if (typeof v === 'number') return Object.is(v, -0) ? '0' : String(v);
  if (typeof v === 'boolean') return String(v);
  if (v instanceof ScriptFunction || v instanceof NativeFunction) return `[Function: ${v.name || '(anonymous)'}]`;
  if (v instanceof Namespace) return v.callable ? `[Function: ${v.name}]` : `Object [${v.name}]`;
  if (depth > 2) return Array.isArray(v) ? '[Array]' : '[Object]';
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    const parts = v.slice(0, 100).map((x) => formatValue(x, true, depth + 1));
    if (v.length > 100) parts.push(`... ${v.length - 100} more items`);
    return `[ ${parts.join(', ')} ]`;
  }
  const keys = Object.keys(v);
  if (!keys.length) return '{}';
  return `{ ${keys
    .slice(0, 30)
    .map((k) => `${IDENT.test(k) ? k : quote(k)}: ${formatValue(v[k], true, depth + 1)}`)
    .join(', ')} }`;
}

/** String conversion used by + and template literals. */
export function toDisplayString(v: Value): string {
  return typeof v === 'string' ? v : formatValue(v);
}
