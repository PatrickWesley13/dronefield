import { Namespace } from '../values';
import { native, numeric, seededRandom } from './helpers';

export function createMath(seed: number): Namespace {
  const random = seededRandom(seed);
  return new Namespace('Math', {
    floor: numeric('Math.floor', Math.floor),
    ceil: numeric('Math.ceil', Math.ceil),
    round: numeric('Math.round', Math.round),
    trunc: numeric('Math.trunc', Math.trunc),
    abs: numeric('Math.abs', Math.abs),
    min: numeric('Math.min', Math.min),
    max: numeric('Math.max', Math.max),
    sqrt: numeric('Math.sqrt', Math.sqrt),
    pow: numeric('Math.pow', Math.pow),
    sign: numeric('Math.sign', Math.sign),
    random: native('Math.random', () => random()),
    PI: Math.PI,
  });
}
