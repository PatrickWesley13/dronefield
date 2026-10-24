import { describe, expect, it } from 'vitest';
import { errorOf, field, run } from './helpers';

describe('sandbox safety', () => {
  it.each([
    'class A {}',
    'new Array(3)',
    'this.x = 1',
    'try { } catch (e) { }',
    'throw 1;',
    'async function f() {}',
    'let r = /ab/;',
    'function* g() {}',
    'import("x")',
  ])('rejects %s before running', (src) => {
    const r = run(src);
    expect(r.outcome.kind).toBe('error');
    expect(r.stats.instructions).toBe(0);
  });
  it.each([
    'window',
    'globalThis',
    'document',
    'eval("1")',
    'Function("return 1")',
    'process',
    'fetch("x")',
    'setTimeout(() => 1)',
    'localStorage',
  ])('has no access to %s', (src) => expect(errorOf(src).message).toMatch(/not defined/));
  it('blocks prototype access', () => {
    for (const src of ['({}).__proto__', '[].constructor', 'Object.prototype', 'Math.constructor', '"x".constructor']) {
      expect(errorOf(src).message, src).toMatch(/can't be|isn't available/);
    }
    expect(errorOf('(1).toString').message).toMatch(/Can't read/);
    expect(errorOf('Object.assign({}, {})').message).toMatch(/isn't available/);
  });
  it('JSON.parse cannot reach prototypes', () => {
    expect(run('const o = JSON.parse(\'{"__proto__": {"x": 1}, "a": 1}\'); console.log(o.x, o.a);').output).toEqual(['undefined 1']);
  });
  it('stops runaway loops with an instruction limit', () => {
    expect(errorOf('let i = 0; while (true) { i++; }', field(), { limits: { maxInstructions: 5000, idleLimit: 1e9 } }).message).toMatch(
      /Instruction limit/,
    );
  });
  it('detects loops that never act', () => {
    expect(errorOf('while (getCropGrowth() < 1) { }', field(), { limits: { idleLimit: 1000 } }).message).toMatch(
      /without the drone doing anything/,
    );
  });
  it('lets long loops that act keep running', () => {
    const r = run('for (let i = 0; i < 3000; i++) wait(1);', field(), { limits: { idleLimit: 100 } });
    expect(r.outcome.kind).toBe('finished');
    expect(r.farm.tick).toBe(3000);
  });
  it('limits recursion depth', () => expect(errorOf('function f() { return f(); } f();').message).toMatch(/nested calls/));
  it('can be stopped mid-run', () => {
    const r = run('while (true) { move("east"); move("west"); }', field(), { stopAfterSteps: 200 });
    expect(r.outcome.kind).toBe('stopped');
    expect(r.farm.tick).toBeGreaterThan(0);
    expect(r.farm.tick).toBeLessThan(400);
  });
  it('enforces locked functions in the interpreter', () => {
    const r = run('harvest();', field(), { unlockedFunctions: ['move'] });
    expect(r.outcome.kind === 'error' && r.outcome.error.message).toMatch(/locked/);
  });
  it('is deterministic, including Math.random', () => {
    const src =
      'for (let i = 0; i < 20; i++) { if (getCropType() === null) plant("wheat"); if (getCropGrowth() === 1) harvest(); move(Math.random() < 0.5 ? "north" : "east"); }';
    const a = run(src),
      b = run(src);
    expect(a.output).toEqual(b.output);
    expect(a.farm.drone).toEqual(b.farm.drone);
    expect(a.farm.tick).toBe(b.farm.tick);
  });
});
