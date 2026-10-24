import { parse, type AnyNode, type Program } from 'acorn';
import { ScriptError } from './errors';
import { syntaxHint } from './hints';

export interface ProgramFeatures {
  readonly usesLoop: boolean;
  readonly usesFunction: boolean;
  readonly usesCondition: boolean;
}

export interface ParsedProgram {
  readonly ast: Program;
  readonly source: string;
  readonly features: ProgramFeatures;
}

/** Syntax that could escape the sandbox, weaken its limits, or isn't worth teaching here. */
const UNSUPPORTED: Readonly<Partial<Record<AnyNode['type'], string>>> = {
  ThisExpression: "`this` isn't available in drone scripts.",
  NewExpression: "`new` isn't available. Use plain arrays [] and objects {} instead.",
  ClassDeclaration: "Classes aren't available to the drone. Use functions and objects instead.",
  ClassExpression: "Classes aren't available to the drone. Use functions and objects instead.",
  TryStatement: "try/catch isn't supported, so safety limits can't be caught. Check values with if before using them.",
  ThrowStatement: "throw isn't supported. Use console.error() to report problems.",
  WithStatement: "with isn't supported.",
  LabeledStatement: "Labels aren't supported. Use a variable to break out of nested loops.",
  AwaitExpression: "async/await isn't needed: drone actions already wait for themselves.",
  YieldExpression: "Generators aren't supported.",
  ImportExpression: "Imports aren't available.",
  ImportDeclaration: "Imports aren't available.",
  ExportNamedDeclaration: "Exports aren't available.",
  ExportDefaultDeclaration: "Exports aren't available.",
  MetaProperty: "That syntax isn't supported.",
  TaggedTemplateExpression: "Tagged templates aren't supported.",
  DebuggerStatement: "debugger isn't supported. Use the Step button instead.",
};

const LOOPS = new Set(['ForStatement', 'ForOfStatement', 'ForInStatement', 'WhileStatement', 'DoWhileStatement']);
const CONDITIONS = new Set(['IfStatement', 'ConditionalExpression', 'SwitchStatement']);
const FUNCTIONS = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);

export function lineOf(node: { loc?: { start: { line: number } } | null } | null | undefined): number | null {
  return node?.loc?.start.line ?? null;
}

function walk(node: AnyNode, visit: (n: AnyNode) => void): void {
  visit(node);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'type' || key === 'start' || key === 'end') continue;
    const child = (node as unknown as Record<string, unknown>)[key];
    if (Array.isArray(child)) {
      for (const c of child) if (c && typeof (c as AnyNode).type === 'string') walk(c as AnyNode, visit);
    } else if (child && typeof (child as AnyNode).type === 'string') walk(child as AnyNode, visit);
  }
}

/** Parses and statically checks a program before anything runs. */
export function parseProgram(source: string): ParsedProgram {
  let ast: Program;
  try {
    ast = parse(source, { ecmaVersion: 2022, sourceType: 'script', locations: true });
  } catch (e) {
    const err = e as Error & { loc?: { line: number } };
    const line = err.loc?.line ?? null;
    const message = String(err.message).replace(/\s*\(\d+:\d+\)\s*$/, '');
    const hint = syntaxHint(line ? (source.split('\n')[line - 1] ?? '') : '', message);
    throw new ScriptError(`Syntax error: ${message}.${hint ? ' ' + hint : ''}`, line);
  }
  let usesLoop = false,
    usesFunction = false,
    usesCondition = false;
  walk(ast, (n) => {
    const reason = UNSUPPORTED[n.type];
    if (reason) throw new ScriptError(reason, lineOf(n));
    if (FUNCTIONS.has(n.type)) {
      const fn = n as Extract<AnyNode, { type: 'FunctionDeclaration' | 'FunctionExpression' | 'ArrowFunctionExpression' }>;
      if (fn.async) throw new ScriptError("async functions aren't needed: drone actions already wait for themselves.", lineOf(n));
      if (fn.generator) throw new ScriptError("Generator functions aren't supported.", lineOf(n));
      usesFunction = true;
    }
    if (n.type === 'Literal' && 'regex' in n && n.regex) throw new ScriptError("Regular expressions aren't supported.", lineOf(n));
    if (n.type === 'Literal' && typeof n.value === 'bigint') throw new ScriptError("BigInt numbers aren't supported.", lineOf(n));
    if (n.type === 'Property' && n.kind !== 'init') throw new ScriptError("Getters and setters aren't supported.", lineOf(n));
    if (LOOPS.has(n.type)) usesLoop = true;
    if (CONDITIONS.has(n.type)) usesCondition = true;
  });
  return { ast, source, features: { usesLoop, usesFunction, usesCondition } };
}
