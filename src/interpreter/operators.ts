import { ScriptError } from './errors';
import { toDisplayString } from './format';
import { isPrimitive, isTruthy, typeName, type Value } from './values';

export type BinaryOperator = '+' | '-' | '*' | '/' | '%' | '**' | '<' | '>' | '<=' | '>=' | '==' | '!=' | '===' | '!==';
const ARITHMETIC = new Set(['-', '*', '/', '%', '**']);
const COMPARISON = new Set(['<', '>', '<=', '>=']);

/** Loose equality, limited to primitives so no player object is ever coerced. */
export function looseEquals(a: Value, b: Value): boolean {
  return isPrimitive(a) && isPrimitive(b) ? a == b : a === b;
}

/**
 * JavaScript operators, with one teaching-friendly difference: mixing types in
 * arithmetic or comparisons is an error instead of silently producing NaN.
 */
export function applyBinary(op: string, l: Value, r: Value): Value {
  if (op === '+') {
    if (typeof l === 'string' || typeof r === 'string') return toDisplayString(l) + toDisplayString(r);
    if (typeof l !== 'number' || typeof r !== 'number') throw new ScriptError(`Can't add ${typeName(l)} and ${typeName(r)}.`);
    return l + r;
  }
  if (ARITHMETIC.has(op)) {
    if (typeof l !== 'number' || typeof r !== 'number')
      throw new ScriptError(`Can't use ${op} with ${typeName(l)} and ${typeName(r)}; both sides need to be numbers.`);
    if ((op === '/' || op === '%') && r === 0) throw new ScriptError('Division by zero.');
    switch (op) {
      case '-':
        return l - r;
      case '*':
        return l * r;
      case '/':
        return l / r;
      case '%':
        return l % r;
      default:
        return l ** r;
    }
  }
  if (COMPARISON.has(op)) {
    const comparable = (typeof l === 'number' && typeof r === 'number') || (typeof l === 'string' && typeof r === 'string');
    if (!comparable) throw new ScriptError(`Can't compare ${typeName(l)} with ${typeName(r)} using ${op}.`);
    const a = l as number | string,
      b = r as number | string;
    switch (op) {
      case '<':
        return a < b;
      case '>':
        return a > b;
      case '<=':
        return a <= b;
      default:
        return a >= b;
    }
  }
  switch (op) {
    case '===':
      return l === r;
    case '!==':
      return l !== r;
    case '==':
      return looseEquals(l, r);
    case '!=':
      return !looseEquals(l, r);
  }
  throw new ScriptError(`The ${op} operator isn't supported.`);
}

export function applyUnary(op: string, v: Value): Value {
  switch (op) {
    case '!':
      return !isTruthy(v);
    case '-':
      return -expectNumber(op, v);
    case '+':
      return expectNumber(op, v);
    case 'typeof':
      return typeName(v) === 'array' || typeName(v) === 'null' ? 'object' : typeName(v);
  }
  throw new ScriptError(`The ${op} operator isn't supported.`);
}

export function expectNumber(op: string, v: Value): number {
  if (typeof v !== 'number') throw new ScriptError(`Can't use ${op} with ${typeName(v)}; it needs a number.`);
  return v;
}

export const COMPOUND_ASSIGNMENT: Readonly<Record<string, string>> = { '+=': '+', '-=': '-', '*=': '*', '/=': '/', '%=': '%', '**=': '**' };
