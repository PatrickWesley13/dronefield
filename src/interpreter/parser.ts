import { parse, type AnyNode, type Program } from 'acorn';
import { ScriptError } from './errors';
import { syntaxHint } from './hints';
import { msg, type Message } from '@/shared/message';

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
const UNSUPPORTED: Readonly<Partial<Record<AnyNode['type'], Message>>> = {
  ThisExpression: msg('error.interp.thisUnsupported', "`this` isn't available in drone scripts."),
  NewExpression: msg('error.interp.newUnsupported', "`new` isn't available. Use plain arrays [] and objects {} instead."),
  ClassDeclaration: msg('error.interp.classUnsupported', "Classes aren't available to the drone. Use functions and objects instead."),
  ClassExpression: msg('error.interp.classUnsupported', "Classes aren't available to the drone. Use functions and objects instead."),
  TryStatement: msg(
    'error.interp.tryUnsupported',
    "try/catch isn't supported, so safety limits can't be caught. Check values with if before using them.",
  ),
  ThrowStatement: msg('error.interp.throwUnsupported', "throw isn't supported. Use console.error() to report problems."),
  WithStatement: msg('error.interp.withUnsupported', "with isn't supported."),
  LabeledStatement: msg('error.interp.labelUnsupported', "Labels aren't supported. Use a variable to break out of nested loops."),
  AwaitExpression: msg('error.interp.awaitUnsupported', "async/await isn't needed: drone actions already wait for themselves."),
  YieldExpression: msg('error.interp.generatorUnsupported', "Generators aren't supported."),
  ImportExpression: msg('error.interp.importUnsupported', "Imports aren't available."),
  ImportDeclaration: msg('error.interp.importUnsupported', "Imports aren't available."),
  ExportNamedDeclaration: msg('error.interp.exportUnsupported', "Exports aren't available."),
  ExportDefaultDeclaration: msg('error.interp.exportUnsupported', "Exports aren't available."),
  MetaProperty: msg('error.interp.metaUnsupported', "That syntax isn't supported."),
  TaggedTemplateExpression: msg('error.interp.taggedTemplateUnsupported', "Tagged templates aren't supported."),
  DebuggerStatement: msg('error.interp.debuggerUnsupported', "debugger isn't supported. Use the Step button instead."),
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
    throw new ScriptError(
      hint
        ? msg('error.interp.syntaxErrorHint', `Syntax error: ${message}. ${hint}`, { message, hint })
        : msg('error.interp.syntaxError', `Syntax error: ${message}.`, { message }),
      line,
    );
  }
  let usesLoop = false,
    usesFunction = false,
    usesCondition = false;
  walk(ast, (n) => {
    const reason = UNSUPPORTED[n.type];
    if (reason) throw new ScriptError(reason, lineOf(n));
    if (FUNCTIONS.has(n.type)) {
      const fn = n as Extract<AnyNode, { type: 'FunctionDeclaration' | 'FunctionExpression' | 'ArrowFunctionExpression' }>;
      if (fn.async)
        throw new ScriptError(
          msg('error.interp.asyncFunctionUnsupported', "async functions aren't needed: drone actions already wait for themselves."),
          lineOf(n),
        );
      if (fn.generator)
        throw new ScriptError(msg('error.interp.generatorFunctionUnsupported', "Generator functions aren't supported."), lineOf(n));
      usesFunction = true;
    }
    if (n.type === 'Literal' && 'regex' in n && n.regex)
      throw new ScriptError(msg('error.interp.regexUnsupported', "Regular expressions aren't supported."), lineOf(n));
    if (n.type === 'Literal' && typeof n.value === 'bigint')
      throw new ScriptError(msg('error.interp.bigintUnsupported', "BigInt numbers aren't supported."), lineOf(n));
    if (n.type === 'Property' && n.kind !== 'init')
      throw new ScriptError(msg('error.interp.getterSetterUnsupported', "Getters and setters aren't supported."), lineOf(n));
    if (LOOPS.has(n.type)) usesLoop = true;
    if (CONDITIONS.has(n.type)) usesCondition = true;
  });
  return { ast, source, features: { usesLoop, usesFunction, usesCondition } };
}
