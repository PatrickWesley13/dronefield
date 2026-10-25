import type * as AST from 'acorn';
import { ScriptError } from './errors';
import { msg } from '@/shared/message';
import { toDisplayString } from './format';
import { UNDEFINED_NAME_HINTS, toCamelCase } from './hints';
import { MAX_CALL_DEPTH, MAX_COLLECTION_SIZE, type ExecutionLimits } from './limits';
import { ARRAY_METHODS } from './methods/arrayMethods';
import { STRING_METHODS } from './methods/stringMethods';
import type { MethodContext } from './methods/types';
import { COMPOUND_ASSIGNMENT, applyBinary, applyUnary, expectNumber } from './operators';
import { lineOf, type ParsedProgram } from './parser';
import { getProperty, setProperty, toPropertyKey } from './properties';
import { Scope } from './scope';
import { immediate, type Execution, type ExecutionSignal } from './signals';
import {
  Deferred,
  Namespace,
  NativeFunction,
  ScriptFunction,
  createObject,
  isPlainObject,
  isTruthy,
  typeName,
  type NativeContext,
  type Value,
} from './values';

export interface DiscardedResult {
  readonly name: string;
  readonly value: Value;
  readonly line: number | null;
  readonly sourceText: string;
}

export interface InterpreterOptions {
  /** Everything the program can see at the top level. */
  readonly globals: ReadonlyMap<string, Value>;
  /** Known names the player hasn't unlocked yet, with a hint on how to unlock them. */
  readonly lockedNames?: ReadonlyMap<string, string>;
  readonly limits: ExecutionLimits;
  /** A number that changes whenever the game makes progress (usually the farm tick). */
  readonly progress: () => number;
  /** Called when an inspection call's result is thrown away, e.g. `getPosX();`. */
  readonly onDiscardedResult?: (info: DiscardedResult) => void;
}

type Completion = { readonly type: 'return'; readonly value: Value } | { readonly type: 'break' } | { readonly type: 'continue' } | null;
type NodeOf<T extends AST.AnyNode['type']> = Extract<AST.AnyNode, { type: T }>;
type StatementHandler<T extends AST.AnyNode['type']> = (node: NodeOf<T>, scope: Scope) => Execution<Completion>;
type ExpressionHandler<T extends AST.AnyNode['type']> = (node: NodeOf<T>, scope: Scope) => Execution<Value>;
type Leaf = (target: AST.Pattern, value: Value) => Execution<void>;

/** Thrown internally to short-circuit an optional chain (`a?.b`). */
const SHORT_CIRCUIT = Symbol('short-circuit');

/**
 * A step-by-step tree-walking interpreter for a safe subset of JavaScript.
 * It never hands player code to the host engine: every node is evaluated here,
 * and every statement yields so the caller can pause, animate or stop it.
 */
export class Interpreter {
  private instructions = 0;
  private idleSteps = 0;
  private depth = 0;
  private lastProgress: number;
  private readonly global: Scope;
  private readonly methodContext: MethodContext & NativeContext;

  constructor(
    private readonly program: ParsedProgram,
    private readonly options: InterpreterOptions,
  ) {
    this.lastProgress = options.progress();
    this.global = new Scope(null, new Set(options.globals.keys()));
    for (const [name, value] of options.globals) this.global.declare(name, value, true);
    this.methodContext = { call: (fn, args) => this.callValue(fn, args, null, 'callback') };
  }

  get instructionCount(): number {
    return this.instructions;
  }

  *run(): Execution<void> {
    this.hoist(this.program.ast.body as AST.Statement[], this.global);
    yield* this.executeList(this.program.ast.body as AST.Statement[], this.global);
  }

  // ------------------------------------------------------------------ bookkeeping
  private *tick(node: AST.Node): Execution<void> {
    const { maxInstructions, idleLimit } = this.options.limits;
    if (++this.instructions > maxInstructions) {
      throw new ScriptError(
        msg(
          'error.interp.instructionLimit',
          `Instruction limit reached (${maxInstructions.toLocaleString('en-US')} steps). Your program may be stuck in a loop, or it needs a more efficient approach.`,
          { steps: maxInstructions.toLocaleString('en-US') },
        ),
        lineOf(node),
      );
    }
    const p = this.options.progress();
    if (p !== this.lastProgress) {
      this.lastProgress = p;
      this.idleSteps = 0;
    } else if (++this.idleSteps > idleLimit) {
      throw new ScriptError(
        msg(
          'error.interp.idleLimit',
          `Your program ran ${idleLimit.toLocaleString('en-US')} steps without the drone doing anything. It's probably a loop that never ends. If you're waiting for a crop to grow, call wait() inside the loop.`,
          { steps: idleLimit.toLocaleString('en-US') },
        ),
        lineOf(node),
      );
    }
    yield { kind: 'step', line: lineOf(node) ?? 0 };
  }

  /** Attaches the current line to errors raised by helpers that don't know it. */
  private withLine<T>(node: AST.Node, fn: () => T): T {
    try {
      return fn();
    } catch (e) {
      if (e instanceof ScriptError && e.line === null) e.line = lineOf(node);
      throw e;
    }
  }

  private *located<T>(node: AST.Node, exec: Execution<T>): Execution<T> {
    try {
      return yield* exec;
    } catch (e) {
      if (e instanceof ScriptError && e.line === null) e.line = lineOf(node);
      throw e;
    }
  }

  private source(node: AST.Node): string {
    return this.program.source.slice(node.start, node.end);
  }

  // ------------------------------------------------------------------ scopes & functions
  private hoist(statements: readonly AST.Statement[], scope: Scope): void {
    for (const s of statements) {
      if (s.type === 'FunctionDeclaration' && s.id) {
        const fn = new ScriptFunction(s.id.name, s.params, s.body, scope);
        this.withLine(s, () => scope.declare(s.id!.name, fn, false));
      }
    }
  }

  private lookup(name: string, node: AST.Node, scope: Scope): Value {
    const owner = scope.find(name);
    if (owner) return owner.get(name);
    if (name === 'undefined') return undefined;
    if (name === 'NaN') return NaN;
    if (name === 'Infinity') return Infinity;
    const locked = this.options.lockedNames?.get(name);
    if (locked)
      throw new ScriptError(msg('error.interp.nameLocked', `${name}() is locked. ${locked}`, { name, reason: locked }), lineOf(node));
    const hint = UNDEFINED_NAME_HINTS[name];
    if (hint) throw new ScriptError(msg('error.interp.notDefinedHint', `'${name}' is not defined. ${hint}`, { name, hint }), lineOf(node));
    const camel = toCamelCase(name);
    if (camel !== name && (this.options.globals.has(camel) || this.options.lockedNames?.has(camel))) {
      throw new ScriptError(
        msg('error.interp.notDefinedDidYouMean', `'${name}' is not defined. Did you mean ${camel}()?`, { name, suggestion: camel }),
        lineOf(node),
      );
    }
    throw new ScriptError(
      msg('error.interp.notDefined', `'${name}' is not defined. Check the spelling, or declare it first with let ${name} = …`, { name }),
      lineOf(node),
    );
  }

  private *callValue(fn: Value, args: Value[], node: AST.Node | null, name: string): Execution<Value> {
    const callee = fn instanceof Namespace && fn.callable ? fn.callable : fn;
    if (callee instanceof NativeFunction) {
      const result = node ? this.withLine(node, () => callee.impl(args, this.methodContext)) : callee.impl(args, this.methodContext);
      if (callee.isAction) yield { kind: 'action', name: callee.name, line: lineOf(node) ?? 0 };
      return result instanceof Deferred ? yield* result.execution : result;
    }
    if (callee instanceof ScriptFunction) return yield* this.callScriptFunction(callee, args, node);
    throw new ScriptError(
      name
        ? msg('error.interp.notAFunction', `${name} is not a function (it's ${typeName(fn)}).`, { name, type: typeName(fn) })
        : msg('error.interp.notAFunctionAnonymous', `That value is not a function (it's ${typeName(fn)}).`, { type: typeName(fn) }),
      lineOf(node),
    );
  }

  private *callScriptFunction(fn: ScriptFunction, args: Value[], node: AST.Node | null): Execution<Value> {
    if (this.depth >= MAX_CALL_DEPTH)
      throw new ScriptError(
        msg(
          'error.interp.tooManyNestedCalls',
          `Too many nested calls (over ${MAX_CALL_DEPTH}). Check that your recursive function has a way to stop.`,
          { max: MAX_CALL_DEPTH },
        ),
        lineOf(node),
      );
    if (++this.instructions > this.options.limits.maxInstructions)
      throw new ScriptError(msg('error.interp.instructionLimitPlain', 'Instruction limit reached.'), lineOf(node));
    const scope = new Scope(fn.closure);
    for (let i = 0; i < fn.params.length; i++) {
      const p = fn.params[i] as AST.Pattern;
      if (p.type === 'RestElement') {
        yield* this.destructure(p.argument, args.slice(i), scope, this.declareLeaf(scope, false));
        break;
      }
      yield* this.destructure(p, args[i], scope, this.declareLeaf(scope, false));
    }
    this.depth++;
    try {
      if (fn.body.type !== 'BlockStatement') return yield* this.evaluate(fn.body, scope);
      this.hoist(fn.body.body, scope);
      const c = yield* this.executeList(fn.body.body, scope);
      return c?.type === 'return' ? c.value : undefined;
    } finally {
      this.depth--;
    }
  }

  private *callMethod(target: Value, key: Value, args: Value[], node: AST.Node): Execution<Value> {
    const k = this.withLine(node, () => toPropertyKey(key));
    if (target instanceof Namespace || isPlainObject(target)) {
      const fn = this.withLine(node, () => getProperty(target, k));
      return yield* this.callValue(fn, args, node, target instanceof Namespace ? `${target.name}.${k}` : String(k));
    }
    const table = Array.isArray(target) ? ARRAY_METHODS : typeof target === 'string' ? STRING_METHODS : null;
    if (!table)
      throw new ScriptError(
        msg('error.interp.cantCallMethod', `Can't call ${k}() on ${typeName(target)}.`, { method: k, type: typeName(target) }),
        lineOf(node),
      );
    const method = Object.prototype.hasOwnProperty.call(table, k) ? table[k] : undefined;
    if (!method)
      throw new ScriptError(
        Array.isArray(target)
          ? msg('error.interp.arrayNoMethod', `Arrays don't have a ${k}() method.`, { method: k })
          : msg('error.interp.stringNoMethod', `Strings don't have a ${k}() method.`, { method: k }),
        lineOf(node),
      );
    return yield* this.located(
      node,
      (method as (t: Value, a: Value[], c: MethodContext) => Execution<Value>)(target, args, this.methodContext),
    );
  }

  // ------------------------------------------------------------------ patterns
  private declareLeaf(scope: Scope, isConst: boolean): Leaf {
    return (target, value) => {
      if (target.type !== 'Identifier')
        throw new ScriptError(msg('error.interp.onlyNamesDeclared', 'Only names can be declared.'), lineOf(target));
      if (value instanceof ScriptFunction && !value.name) value.name = target.name;
      this.withLine(target, () => scope.declare(target.name, value, isConst));
      return immediate(undefined);
    };
  }

  private assignLeaf(scope: Scope, node: AST.Node): Leaf {
    return (target, value) => this.assign(target, value, scope, node);
  }

  private *destructure(pattern: AST.Pattern, value: Value, scope: Scope, leaf: Leaf): Execution<void> {
    switch (pattern.type) {
      case 'Identifier':
      case 'MemberExpression':
        return yield* leaf(pattern, value);
      case 'AssignmentPattern': {
        let v = value;
        if (v === undefined) {
          v = yield* this.evaluate(pattern.right, scope);
          if (v instanceof ScriptFunction && !v.name && pattern.left.type === 'Identifier') v.name = pattern.left.name;
        }
        return yield* this.destructure(pattern.left, v, scope, leaf);
      }
      case 'ArrayPattern': {
        const items = Array.isArray(value) ? value : typeof value === 'string' ? Array.from(value) : null;
        if (!items)
          throw new ScriptError(
            msg('error.interp.cantUnpackArray', `${typeName(value)} can't be unpacked like an array.`, { type: typeName(value) }),
            lineOf(pattern),
          );
        for (let i = 0; i < pattern.elements.length; i++) {
          const el = pattern.elements[i];
          if (!el) continue;
          if (el.type === 'RestElement') {
            yield* this.destructure(el.argument, items.slice(i), scope, leaf);
            break;
          }
          yield* this.destructure(el, items[i], scope, leaf);
        }
        return;
      }
      case 'ObjectPattern': {
        if (value === null || value === undefined)
          throw new ScriptError(
            msg('error.interp.cannotDestructure', `Cannot destructure ${typeName(value)}.`, { type: typeName(value) }),
            lineOf(pattern),
          );
        const used = new Set<string>();
        for (const prop of pattern.properties) {
          if (prop.type === 'RestElement') {
            const rest = createObject();
            if (isPlainObject(value)) for (const k of Object.keys(value)) if (!used.has(k)) rest[k] = value[k];
            yield* this.destructure(prop.argument, rest, scope, leaf);
            continue;
          }
          const key = prop.computed ? yield* this.evaluate(prop.key as AST.Expression, scope) : this.staticKey(prop.key);
          used.add(String(key));
          yield* this.destructure(
            prop.value,
            this.withLine(prop, () => getProperty(value, key)),
            scope,
            leaf,
          );
        }
        return;
      }
      case 'RestElement':
        throw new ScriptError(msg('error.interp.restMustBeLast', 'A rest element (...) must come last.'), lineOf(pattern));
    }
  }

  private staticKey(key: AST.Expression | AST.PrivateIdentifier): string {
    if (key.type === 'Identifier') return key.name;
    if (key.type === 'Literal') return String(key.value);
    throw new ScriptError(msg('error.interp.unsupportedPropertyName', 'Unsupported property name.'), lineOf(key));
  }

  private *assign(target: AST.Pattern | AST.Expression, value: Value, scope: Scope, node: AST.Node): Execution<void> {
    if (target.type === 'ArrayPattern' || target.type === 'ObjectPattern')
      return yield* this.destructure(target, value, scope, this.assignLeaf(scope, node));
    if (target.type === 'Identifier') {
      const owner = scope.find(target.name);
      if (!owner)
        throw new ScriptError(
          msg('error.interp.undeclared', `'${target.name}' hasn't been declared. Use let ${target.name} = … the first time.`, {
            name: target.name,
          }),
          lineOf(node),
        );
      return this.withLine(node, () => owner.set(target.name, value));
    }
    if (target.type === 'MemberExpression') {
      const obj = yield* this.evaluate(target.object as AST.Expression, scope);
      const key = yield* this.memberKey(target, scope);
      return this.withLine(node, () => setProperty(obj, key, value));
    }
    throw new ScriptError(
      msg('error.interp.invalidAssignTarget', 'You can only assign to variables, list items or object properties.'),
      lineOf(node),
    );
  }

  private *read(target: AST.Pattern | AST.Expression, scope: Scope): Execution<Value> {
    if (target.type === 'Identifier') return this.lookup(target.name, target, scope);
    if (target.type === 'MemberExpression') {
      const obj = yield* this.evaluate(target.object as AST.Expression, scope);
      const key = yield* this.memberKey(target, scope);
      return this.withLine(target, () => getProperty(obj, key));
    }
    throw new ScriptError(msg('error.interp.cantUpdate', 'That can’t be updated.'), lineOf(target));
  }

  private *memberKey(node: AST.MemberExpression, scope: Scope): Execution<Value> {
    if (node.computed) return yield* this.evaluate(node.property as AST.Expression, scope);
    return (node.property as AST.Identifier).name;
  }

  private *evaluateList(list: ReadonlyArray<AST.Expression | AST.SpreadElement | null>, scope: Scope): Execution<Value[]> {
    const out: Value[] = [];
    for (const item of list) {
      if (item === null) throw new ScriptError(msg('error.interp.emptyArraySlot', "Empty slots in arrays aren't supported."));
      if (item.type === 'SpreadElement') {
        const v = yield* this.evaluate(item.argument, scope);
        const items = Array.isArray(v) ? v : typeof v === 'string' ? Array.from(v) : null;
        if (!items)
          throw new ScriptError(
            msg('error.interp.spreadNotIterable', `Only arrays and strings can be spread with ..., not ${typeName(v)}.`, {
              type: typeName(v),
            }),
            lineOf(item),
          );
        out.push(...items);
      } else out.push(yield* this.evaluate(item, scope));
      if (out.length > MAX_COLLECTION_SIZE) throw new ScriptError(msg('error.interp.tooManyItems', 'Too many items.'), lineOf(item));
    }
    return out;
  }

  // ------------------------------------------------------------------ statements
  private *executeList(statements: readonly AST.Statement[], scope: Scope): Execution<Completion> {
    for (const s of statements) {
      const c = yield* this.execute(s, scope);
      if (c) return c;
    }
    return null;
  }

  private *execute(node: AST.Statement | AST.Declaration | AST.ModuleDeclaration, scope: Scope): Execution<Completion> {
    const handler = this.statements[node.type as keyof typeof this.statements] as StatementHandler<AST.AnyNode['type']> | undefined;
    if (!handler)
      throw new ScriptError(
        msg('error.interp.unsupportedSyntax', `${node.type} isn't supported in drone scripts.`, { nodeType: node.type }),
        lineOf(node),
      );
    return yield* handler(node as never, scope);
  }

  /** 1 = break the loop, 0 = keep looping, otherwise a completion to propagate. */
  private *loopBody(body: AST.Statement, scope: Scope): Execution<Completion | 0 | 1> {
    const c = yield* this.execute(body, scope);
    if (!c || c.type === 'continue') return 0;
    if (c.type === 'break') return 1;
    return c;
  }

  private readonly statements: { [K in AST.AnyNode['type']]?: StatementHandler<K> } = {
    ExpressionStatement: (node, scope) => this.execExpressionStatement(node, scope),
    VariableDeclaration: (node, scope) => this.execVariableDeclaration(node, scope),
    FunctionDeclaration: () => immediate(null),
    EmptyStatement: () => immediate(null),
    BlockStatement: (node, scope) => this.execBlockStatement(node, scope),
    IfStatement: (node, scope) => this.execIfStatement(node, scope),
    WhileStatement: (node, scope) => this.execWhileStatement(node, scope),
    DoWhileStatement: (node, scope) => this.execDoWhileStatement(node, scope),
    ForStatement: (node, scope) => this.execForStatement(node, scope),
    ForOfStatement: (node, scope) => this.execForOfStatement(node, scope),
    ForInStatement: (node, scope) => this.execForInStatement(node, scope),
    SwitchStatement: (node, scope) => this.execSwitchStatement(node, scope),
    ReturnStatement: (node, scope) => this.execReturnStatement(node, scope),
    BreakStatement: (node) => this.execBreakStatement(node),
    ContinueStatement: (node) => this.execContinueStatement(node),
  };

  private *execExpressionStatement(node: NodeOf<'ExpressionStatement'>, scope: Scope): Execution<Completion> {
    yield* this.tick(node);
    const value = yield* this.evaluate(node.expression, scope);
    this.reportDiscarded(node.expression, value, scope);
    return null;
  }

  private *execVariableDeclaration(node: NodeOf<'VariableDeclaration'>, scope: Scope): Execution<Completion> {
    yield* this.tick(node);
    for (const d of node.declarations) {
      if (node.kind === 'const' && !d.init)
        throw new ScriptError(msg('error.interp.constNeedsValue', 'const declarations need a value, like const total = 5.'), lineOf(d));
      const value = d.init ? yield* this.evaluate(d.init, scope) : undefined;
      yield* this.destructure(d.id, value, scope, this.declareLeaf(scope, node.kind === 'const'));
    }
    return null;
  }

  private *execBlockStatement(node: NodeOf<'BlockStatement'>, scope: Scope): Execution<Completion> {
    const inner = new Scope(scope);
    this.hoist(node.body, inner);
    return yield* this.executeList(node.body, inner);
  }

  private *execIfStatement(node: NodeOf<'IfStatement'>, scope: Scope): Execution<Completion> {
    yield* this.tick(node);
    if (isTruthy(yield* this.evaluate(node.test, scope))) return yield* this.execute(node.consequent, scope);
    return node.alternate ? yield* this.execute(node.alternate, scope) : null;
  }

  private *execWhileStatement(node: NodeOf<'WhileStatement'>, scope: Scope): Execution<Completion> {
    for (;;) {
      yield* this.tick(node);
      if (!isTruthy(yield* this.evaluate(node.test, scope))) return null;
      const r = yield* this.loopBody(node.body, scope);
      if (r === 1) return null;
      if (r) return r;
    }
  }

  private *execDoWhileStatement(node: NodeOf<'DoWhileStatement'>, scope: Scope): Execution<Completion> {
    for (;;) {
      yield* this.tick(node);
      const r = yield* this.loopBody(node.body, scope);
      if (r === 1) return null;
      if (r) return r;
      if (!isTruthy(yield* this.evaluate(node.test, scope))) return null;
    }
  }

  private *execForStatement(node: NodeOf<'ForStatement'>, scope: Scope): Execution<Completion> {
    const inner = new Scope(scope);
    if (node.init) {
      if (node.init.type === 'VariableDeclaration') yield* this.execute(node.init, inner);
      else yield* this.evaluate(node.init, inner);
    }
    for (;;) {
      yield* this.tick(node);
      if (node.test && !isTruthy(yield* this.evaluate(node.test, inner))) return null;
      const r = yield* this.loopBody(node.body, inner);
      if (r === 1) return null;
      if (r) return r;
      if (node.update) yield* this.evaluate(node.update, inner);
    }
  }

  private *execForOfStatement(node: NodeOf<'ForOfStatement'>, scope: Scope): Execution<Completion> {
    yield* this.tick(node);
    const source = yield* this.evaluate(node.right, scope);
    const items = Array.isArray(source) ? source : typeof source === 'string' ? Array.from(source) : null;
    if (!items)
      throw new ScriptError(
        msg(
          'error.interp.forOfNotIterable',
          `for…of needs an array or a string, not ${typeName(source)}. To loop over an object, use Object.entries(obj).`,
          { type: typeName(source) },
        ),
        lineOf(node),
      );
    return yield* this.iterate(node, items, scope);
  }

  private *execForInStatement(node: NodeOf<'ForInStatement'>, scope: Scope): Execution<Completion> {
    yield* this.tick(node);
    const source = yield* this.evaluate(node.right, scope);
    const keys = isPlainObject(source) ? Object.keys(source) : Array.isArray(source) ? source.map((_, i) => String(i)) : null;
    if (!keys)
      throw new ScriptError(
        msg('error.interp.forInNotObject', `for…in needs an object, not ${typeName(source)}.`, { type: typeName(source) }),
        lineOf(node),
      );
    return yield* this.iterate(node, keys, scope);
  }

  private *execSwitchStatement(node: NodeOf<'SwitchStatement'>, scope: Scope): Execution<Completion> {
    yield* this.tick(node);
    const subject = yield* this.evaluate(node.discriminant, scope);
    const inner = new Scope(scope);
    let start = -1;
    for (let i = 0; i < node.cases.length && start < 0; i++) {
      const test = node.cases[i]?.test;
      if (test && (yield* this.evaluate(test, inner)) === subject) start = i;
    }
    if (start < 0) start = node.cases.findIndex((c) => !c.test);
    if (start < 0) return null;
    for (let i = start; i < node.cases.length; i++) {
      const c = yield* this.executeList(node.cases[i]?.consequent ?? [], inner);
      if (c) return c.type === 'break' ? null : c;
    }
    return null;
  }

  private *execReturnStatement(node: NodeOf<'ReturnStatement'>, scope: Scope): Execution<Completion> {
    yield* this.tick(node);
    return { type: 'return', value: node.argument ? yield* this.evaluate(node.argument, scope) : undefined };
  }

  private *execBreakStatement(node: NodeOf<'BreakStatement'>): Execution<Completion> {
    yield* this.tick(node);
    return { type: 'break' };
  }

  private *execContinueStatement(node: NodeOf<'ContinueStatement'>): Execution<Completion> {
    yield* this.tick(node);
    return { type: 'continue' };
  }

  private *iterate(node: AST.ForOfStatement | AST.ForInStatement, items: Value[], scope: Scope): Execution<Completion> {
    for (let i = 0; i < items.length; i++) {
      if (i > 0) yield* this.tick(node);
      const inner = new Scope(scope);
      if (node.left.type === 'VariableDeclaration') {
        const decl = node.left.declarations[0] as AST.VariableDeclarator;
        yield* this.destructure(decl.id, items[i], inner, this.declareLeaf(inner, node.left.kind === 'const'));
      } else yield* this.assign(node.left, items[i], inner, node);
      const r = yield* this.loopBody(node.body, inner);
      if (r === 1) return null;
      if (r) return r;
    }
    return null;
  }

  private reportDiscarded(expr: AST.Expression, value: Value, scope: Scope): void {
    if (value === undefined || !this.options.onDiscardedResult) return;
    if (expr.type !== 'CallExpression' || expr.callee.type !== 'Identifier') return;
    const name = expr.callee.name;
    const fn = scope.find(name)?.get(name);
    if (fn instanceof NativeFunction && !fn.isAction) {
      this.options.onDiscardedResult({ name, value, line: lineOf(expr), sourceText: this.source(expr) });
    }
  }

  // ------------------------------------------------------------------ expressions
  private *evaluate(node: AST.Expression | AST.PrivateIdentifier | AST.Super, scope: Scope): Execution<Value> {
    const handler = this.expressions[node.type as keyof typeof this.expressions] as ExpressionHandler<AST.AnyNode['type']> | undefined;
    if (!handler)
      throw new ScriptError(
        msg('error.interp.unsupportedSyntax', `${node.type} isn't supported in drone scripts.`, { nodeType: node.type }),
        lineOf(node),
      );
    return yield* handler(node as never, scope);
  }

  private readonly expressions: { [K in AST.AnyNode['type']]?: ExpressionHandler<K> } = {
    Literal: (node) => immediate(node.value as Value),
    Identifier: (node, scope) => immediate(this.lookup(node.name, node, scope)),
    TemplateLiteral: (node, scope) => this.evalTemplateLiteral(node, scope),
    ArrayExpression: (node, scope) => this.evalArrayExpression(node, scope),
    ObjectExpression: (node, scope) => this.evalObjectExpression(node, scope),
    UnaryExpression: (node, scope) => this.evalUnaryExpression(node, scope),
    BinaryExpression: (node, scope) => this.evalBinaryExpression(node, scope),
    LogicalExpression: (node, scope) => this.evalLogicalExpression(node, scope),
    ConditionalExpression: (node, scope) => this.evalConditionalExpression(node, scope),
    AssignmentExpression: (node, scope) => this.evalAssignmentExpression(node, scope),
    UpdateExpression: (node, scope) => this.evalUpdateExpression(node, scope),
    CallExpression: (node, scope) => this.evalCallExpression(node, scope),
    ChainExpression: (node, scope) => this.evalChainExpression(node, scope),
    MemberExpression: (node, scope) => this.evalMemberExpression(node, scope),
    ArrowFunctionExpression: (node, scope) => immediate(new ScriptFunction('', node.params, node.body, scope)),
    FunctionExpression: (node, scope) => immediate(new ScriptFunction(node.id?.name ?? '', node.params, node.body, scope)),
    SequenceExpression: (node, scope) => this.evalSequenceExpression(node, scope),
    ParenthesizedExpression: (node, scope) => this.evalParenthesizedExpression(node, scope),
  };

  private *evalTemplateLiteral(node: NodeOf<'TemplateLiteral'>, scope: Scope): Execution<Value> {
    let text = '';
    for (let i = 0; i < node.quasis.length; i++) {
      text += node.quasis[i]?.value.cooked ?? '';
      const expr = node.expressions[i];
      if (expr) text += toDisplayString(yield* this.evaluate(expr, scope));
    }
    return text;
  }

  private *evalArrayExpression(node: NodeOf<'ArrayExpression'>, scope: Scope): Execution<Value> {
    return yield* this.located(node, this.evaluateList(node.elements, scope));
  }

  private *evalObjectExpression(node: NodeOf<'ObjectExpression'>, scope: Scope): Execution<Value> {
    const obj = createObject();
    for (const p of node.properties) {
      if (p.type === 'SpreadElement') {
        const v = yield* this.evaluate(p.argument, scope);
        if (Array.isArray(v)) v.forEach((x, i) => (obj[String(i)] = x));
        else if (isPlainObject(v)) for (const k of Object.keys(v)) obj[k] = v[k];
        else if (v !== null && v !== undefined)
          throw new ScriptError(
            msg('error.interp.cantSpreadIntoObject', `Can't spread ${typeName(v)} into an object.`, { type: typeName(v) }),
            lineOf(p),
          );
        continue;
      }
      const key = p.computed ? yield* this.evaluate(p.key, scope) : this.staticKey(p.key);
      const k = this.withLine(p, () => toPropertyKey(key));
      const value = yield* this.evaluate(p.value as AST.Expression, scope);
      if (value instanceof ScriptFunction && !value.name) value.name = String(k);
      obj[String(k)] = value;
    }
    return obj;
  }

  private *evalUnaryExpression(node: NodeOf<'UnaryExpression'>, scope: Scope): Execution<Value> {
    if (
      node.operator === 'typeof' &&
      node.argument.type === 'Identifier' &&
      !scope.find(node.argument.name) &&
      !this.options.globals.has(node.argument.name)
    ) {
      if (!['NaN', 'Infinity'].includes(node.argument.name)) return 'undefined';
    }
    const v = yield* this.evaluate(node.argument, scope);
    return this.withLine(node, () => applyUnary(node.operator, v));
  }

  private *evalBinaryExpression(node: NodeOf<'BinaryExpression'>, scope: Scope): Execution<Value> {
    const l = yield* this.evaluate(node.left as AST.Expression, scope);
    const r = yield* this.evaluate(node.right, scope);
    return this.withLine(node, () => applyBinary(node.operator, l, r));
  }

  private *evalLogicalExpression(node: NodeOf<'LogicalExpression'>, scope: Scope): Execution<Value> {
    const l = yield* this.evaluate(node.left, scope);
    if (node.operator === '&&') return isTruthy(l) ? yield* this.evaluate(node.right, scope) : l;
    if (node.operator === '||') return isTruthy(l) ? l : yield* this.evaluate(node.right, scope);
    return l === null || l === undefined ? yield* this.evaluate(node.right, scope) : l;
  }

  private *evalConditionalExpression(node: NodeOf<'ConditionalExpression'>, scope: Scope): Execution<Value> {
    return isTruthy(yield* this.evaluate(node.test, scope))
      ? yield* this.evaluate(node.consequent, scope)
      : yield* this.evaluate(node.alternate, scope);
  }

  private *evalAssignmentExpression(node: NodeOf<'AssignmentExpression'>, scope: Scope): Execution<Value> {
    let value: Value;
    if (node.operator === '=') value = yield* this.evaluate(node.right, scope);
    else {
      const op = COMPOUND_ASSIGNMENT[node.operator];
      if (!op)
        throw new ScriptError(
          msg('error.interp.operatorUnsupported', `The ${node.operator} operator isn't supported.`, { op: node.operator }),
          lineOf(node),
        );
      const current = yield* this.read(node.left, scope);
      const rhs = yield* this.evaluate(node.right, scope);
      value = this.withLine(node, () => applyBinary(op, current, rhs));
    }
    yield* this.assign(node.left, value, scope, node);
    return value;
  }

  private *evalUpdateExpression(node: NodeOf<'UpdateExpression'>, scope: Scope): Execution<Value> {
    const current = yield* this.read(node.argument, scope);
    const n = this.withLine(node, () => expectNumber(node.operator, current));
    const next = node.operator === '++' ? n + 1 : n - 1;
    yield* this.assign(node.argument, next, scope, node);
    return node.prefix ? next : n;
  }

  private *evalCallExpression(node: NodeOf<'CallExpression'>, scope: Scope): Execution<Value> {
    if (node.callee.type === 'MemberExpression') {
      const member = node.callee;
      const target = yield* this.evaluate(member.object as AST.Expression, scope);
      if (member.optional && (target === null || target === undefined)) throw SHORT_CIRCUIT;
      const key = yield* this.memberKey(member, scope);
      if (target === null || target === undefined)
        throw new ScriptError(
          msg('error.interp.cannotReadProperty', `Cannot read properties of ${typeName(target)} (reading '${String(key)}').`, {
            type: typeName(target),
            key: String(key),
          }),
          lineOf(node),
        );
      if (node.optional && isPlainObject(target)) {
        const fn = this.withLine(node, () => getProperty(target, key));
        if (fn === null || fn === undefined) throw SHORT_CIRCUIT;
      }
      const args = yield* this.located(node, this.evaluateList(node.arguments, scope));
      return yield* this.callMethod(target, key, args, node);
    }
    const fn = yield* this.evaluate(node.callee as AST.Expression, scope);
    if (node.optional && (fn === null || fn === undefined)) throw SHORT_CIRCUIT;
    const args = yield* this.located(node, this.evaluateList(node.arguments, scope));
    return yield* this.callValue(fn, args, node, node.callee.type === 'Identifier' ? node.callee.name : '');
  }

  private *evalChainExpression(node: NodeOf<'ChainExpression'>, scope: Scope): Execution<Value> {
    try {
      return yield* this.evaluate(node.expression, scope);
    } catch (e) {
      if (e === SHORT_CIRCUIT) return undefined;
      throw e;
    }
  }

  private *evalMemberExpression(node: NodeOf<'MemberExpression'>, scope: Scope): Execution<Value> {
    const target = yield* this.evaluate(node.object as AST.Expression, scope);
    if (node.optional && (target === null || target === undefined)) throw SHORT_CIRCUIT;
    const key = yield* this.memberKey(node, scope);
    if ((target === null || target === undefined) && node.object.type === 'CallExpression') {
      throw new ScriptError(
        msg(
          'error.interp.cannotReadPropertyAfterCall',
          `Cannot read properties of ${typeName(target)} (reading '${String(key)}'). That call returned ${typeName(target)}.`,
          { type: typeName(target), key: String(key) },
        ),
        lineOf(node),
      );
    }
    return this.withLine(node, () => getProperty(target, key));
  }

  private *evalSequenceExpression(node: NodeOf<'SequenceExpression'>, scope: Scope): Execution<Value> {
    let v: Value;
    for (const e of node.expressions) v = yield* this.evaluate(e, scope);
    return v;
  }

  private *evalParenthesizedExpression(node: NodeOf<'ParenthesizedExpression'>, scope: Scope): Execution<Value> {
    return yield* this.evaluate(node.expression, scope);
  }
}

export type { ExecutionSignal };
