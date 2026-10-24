import { toDisplayString } from '../format';
import { Namespace, isTruthy, type Value } from '../values';
import { native, primitiveOnly } from './helpers';

export function createConversions(): ReadonlyArray<[string, Value]> {
  return [
    [
      'Number',
      new Namespace(
        'Number',
        {
          isInteger: native('Number.isInteger', ([v]) => Number.isInteger(v)),
          isFinite: native('Number.isFinite', ([v]) => Number.isFinite(v)),
          isNaN: native('Number.isNaN', ([v]) => Number.isNaN(v)),
          MAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER,
        },
        primitiveOnly('Number', (a) => (a.length ? Number(a[0]) : 0)),
      ),
    ],
    [
      'String',
      new Namespace(
        'String',
        {},
        native('String', (a) => (a.length ? toDisplayString(a[0]) : '')),
      ),
    ],
    [
      'Boolean',
      new Namespace(
        'Boolean',
        {},
        native('Boolean', ([v]) => isTruthy(v)),
      ),
    ],
    ['parseInt', primitiveOnly('parseInt', ([s, radix]) => parseInt(String(s), radix === undefined ? 10 : Number(radix)))],
    ['parseFloat', primitiveOnly('parseFloat', ([s]) => parseFloat(String(s)))],
    ['isNaN', primitiveOnly('isNaN', ([v]) => Number.isNaN(Number(v)))],
    ['isFinite', primitiveOnly('isFinite', ([v]) => Number.isFinite(Number(v)))],
  ];
}
