import { describe, expect, it } from 'vitest';
import { errorOf, output } from './helpers';

describe('interpreter: language', () => {
  it('handles arithmetic and variables', () => {
    expect(output('let a = 2; const b = 3; a += b * 4; console.log(a, a % 5, 2 ** 3, 7 / 2);')).toEqual(['14 4 8 3.5']);
  });
  it('handles strings and templates', () => {
    expect(output('const n = "drone"; console.log(`hi ${n}!`, n.length, n.toUpperCase(), "a" + 1);')).toEqual(['hi drone! 5 DRONE a1']);
  });
  it('handles if / else if / else', () => {
    expect(
      output('for (const x of [1, 5, 9]) { if (x < 3) console.log("low"); else if (x < 7) console.log("mid"); else console.log("high"); }'),
    ).toEqual(['low', 'mid', 'high']);
  });
  it('handles while, break and continue', () => {
    expect(output('let i = 0, s = 0; while (true) { i++; if (i % 2 === 0) continue; if (i > 9) break; s += i; } console.log(s);')).toEqual([
      '25',
    ]);
  });
  it('handles do...while', () => expect(output('let i = 0; do { i++; } while (i < 3); console.log(i);')).toEqual(['3']));
  it('handles for, for...of, for...in and Array.from', () => {
    expect(
      output(
        'let t = 0; for (let i = 0; i < 4; i++) t += i; for (const v of Array.from({ length: 3 }, (_, i) => i + 2)) t += v; const ks = []; for (const k in {a: 1, b: 2}) ks.push(k); console.log(t, ks);',
      ),
    ).toEqual(["15 [ 'a', 'b' ]"]);
  });
  it('handles functions, recursion, defaults and hoisting', () => {
    expect(
      output(
        'function fib(n) { if (n < 2) return n; return fib(n - 1) + fib(n - 2); } function g(a, b = 10) { return a + b; } console.log(fib(15), g(1), hoisted());\nfunction hoisted() { return "ok"; }',
      ),
    ).toEqual(['610 11 ok']);
  });
  it('handles closures and higher-order array methods', () => {
    expect(
      output(
        'function counter() { let c = 0; return () => ++c; } const n = counter(); n(); n(); console.log(n(), [1,2,3].map(x => x * 2), [1,2,3,4].filter(x => x % 2 === 0), [1,2,3].reduce((a, b) => a + b));',
      ),
    ).toEqual(['3 [ 2, 4, 6 ] [ 2, 4 ] 6']);
  });
  it('handles arrays and objects', () => {
    expect(
      output(
        'const l = [3, 1]; l.push(4); l[5] = 9; const o = {x: 1}; o.y = 2; o["z"] = l.length; console.log(l, o, l.indexOf(4), l.includes(7));',
      ),
    ).toEqual(['[ 3, 1, 4, undefined, undefined, 9 ] { x: 1, y: 2, z: 6 } 2 false']);
  });
  it('handles switch with fallthrough', () => {
    expect(
      output(
        'function f(c) { switch (c) { case "a": case "b": return 1; case "c": return 2; default: return 0; } } console.log(f("b"), f("c"), f("z"));',
      ),
    ).toEqual(['1 2 0']);
  });
  it('follows JavaScript semantics for undefined, ==, ?? and typeof', () => {
    expect(
      output(
        'let a; const o = {}; function f() {} console.log(a, o.x, f(), [1][5], typeof a, typeof [], typeof null, a ?? "d", null == undefined, 1 == "1", 1 === "1", 0.1 + 0.2);',
      ),
    ).toEqual(['undefined undefined undefined undefined undefined object object d true true false 0.30000000000000004']);
  });
  it('supports destructuring, spread, rest and optional chaining', () => {
    expect(
      output(
        'const [a, b = 5, ...rest] = [1, undefined, 3, 4]; const {x, y: why = 2, ...others} = {x: 1, z: 3}; let p = 1, q = 2; [p, q] = [q, p]; const sum = (...ns) => ns.reduce((s, n) => s + n, 0); const n = null; console.log(a, b, rest, x, why, others, p, q, sum(...[1, 2, 3]), {...{k: 1}, m: 2}, n?.foo, n?.foo.bar, ({}).missing?.(), [..."ab"]);',
      ),
    ).toEqual(["1 5 [ 3, 4 ] 1 2 { z: 3 } 2 1 6 { k: 1, m: 2 } undefined undefined undefined [ 'a', 'b' ]"]);
  });
  it('sorts stably with and without a compare function', () => {
    expect(output('console.log([3, 1, 2].sort(), [3, 1, 2].sort((a, b) => b - a), ["b", "a"].sort());')).toEqual([
      "[ 1, 2, 3 ] [ 3, 2, 1 ] [ 'a', 'b' ]",
    ]);
  });
});

describe('interpreter: errors', () => {
  it('reports syntax errors with the line', () => {
    const e = errorOf('move("east");\nif (x > {');
    expect(e.message).toMatch(/Syntax error/);
    expect(e.line).toBe(2);
  });
  it('gives JavaScript hints for Python habits', () => {
    expect(errorOf('if (true) {}\nelif (false) {}').message).toMatch(/else if/);
    expect(errorOf('let a = True;').message).toMatch(/true/);
    expect(errorOf('print("hi");').message).toMatch(/console\.log/);
    expect(errorOf('for (const i of range(3)) {}').message).toMatch(/for loop/);
    expect(errorOf('get_pos_x();').message).toMatch(/getPosX/);
  });
  it('reports undefined variables with the line', () => {
    const e = errorOf('let a = 1;\nconsole.log(b);');
    expect(e.message).toMatch(/'b' is not defined/);
    expect(e.line).toBe(2);
  });
  it('rejects const reassignment and built-in reassignment', () => {
    expect(errorOf('const a = 1; a = 2;').message).toMatch(/const/);
    expect(errorOf('move = 3;').message).toMatch(/built in/);
  });
  it('rejects type mixing with friendly errors', () => {
    expect(errorOf('let x = "a" - 1;').message).toMatch(/both sides need to be numbers/);
    expect(errorOf('if (null < 1) {}').message).toMatch(/compare/);
    expect(errorOf('console.log(1 / 0);').message).toMatch(/Division by zero/);
  });
  it('explains reading properties of undefined', () => {
    expect(errorOf('const o = {};\no.a.b;')).toEqual({ message: "Cannot read properties of undefined (reading 'b').", line: 2 });
  });
});
