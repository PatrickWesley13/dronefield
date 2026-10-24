import { describe, expect, it } from 'vitest';
import { output, run } from './helpers';

describe('standard library', () => {
  it('prints Node-style values with console methods', () => {
    expect(
      run('console.log("a", 1, [1, "x"], {k: "v"}, undefined); console.info("i"); console.warn("w"); console.error("e");').output,
    ).toEqual(["a 1 [ 1, 'x' ] { k: 'v' } undefined", '[info] i', '[warn] w', '[error] e']);
  });
  it('console.clear empties the output', () => expect(run('console.log(1); console.clear(); console.log(2);').output).toEqual(['2']));
  it('provides JSON, Object, Array and conversions', () => {
    expect(
      output(
        'const inv = {wheat: 2, carrot: 0}; console.log(JSON.stringify(inv), Object.keys(inv), Object.values(inv), Array.isArray([]), JSON.parse("[1,{\\"a\\":2}]")[1].a, Number("4") + 1, String(5) + 1, parseInt("12px"), Number.isInteger(2.5), JSON.stringify({f: () => 1, n: 1}));',
      ),
    ).toEqual(['{"wheat":2,"carrot":0} [ \'wheat\', \'carrot\' ] [ 2, 0 ] true 2 5 51 12 false {"n":1}']);
  });
  it('supports Object.entries with destructuring', () => {
    expect(output('for (const [k, v] of Object.entries({w: 1, c: 2})) console.log(k, v);')).toEqual(['w 1', 'c 2']);
  });
  it('provides Math helpers', () =>
    expect(output('console.log(Math.floor(2.7), Math.max(1, 9, 3), Math.abs(-4), Math.trunc(-1.5));')).toEqual(['2 9 4 -1']));
  it('flags unused inspection results', () => expect(run('getPosX();\nmove("east");').output).toContain('? getPosX() unused'));
});
