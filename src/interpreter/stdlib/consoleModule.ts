import { formatValue } from '../format';
import { Namespace } from '../values';
import { native } from './helpers';
import type { ConsoleLevel, ScriptConsole } from './types';

export function createConsole(out: ScriptConsole): Namespace {
  const writer = (level: ConsoleLevel) =>
    native(`console.${level}`, (args) => {
      out.write(level, args.map((v) => formatValue(v)).join(' '));
      return undefined;
    });
  return new Namespace('console', {
    log: writer('log'),
    info: writer('info'),
    warn: writer('warn'),
    error: writer('error'),
    debug: writer('log'),
    clear: native('console.clear', () => {
      out.clear();
      return undefined;
    }),
  });
}
