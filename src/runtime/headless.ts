import type { GameNotices } from '@/api';
import type { Farm } from '@/domain/farm';
import { parseProgram, type ConsoleLevel, type ExecutionLimits } from '@/interpreter';
import type { Mission } from '@/missions';
import { unlockHint } from '@/progression';
import { MISSION_LIMITS } from './limits';
import { ProgramRun, type RunOutcome, type RunStats } from './programRun';

export interface HeadlessResult {
  readonly outcome: RunOutcome;
  readonly output: readonly string[];
  readonly farm: Farm;
  readonly stats: RunStats;
}

export interface HeadlessOptions {
  readonly unlockedFunctions: Iterable<string>;
  readonly mission?: Mission;
  readonly limits?: Partial<ExecutionLimits>;
  /** Stop after this many steps, as if the player pressed Stop. */
  readonly stopAfterSteps?: number;
  readonly randomSeed?: number;
}

/** Runs a program to the end without any UI. Used by tests and tools. */
export function runHeadless(source: string, farm: Farm, options: HeadlessOptions): HeadlessResult {
  const output: string[] = [];
  const console = {
    write: (level: ConsoleLevel, text: string) => output.push(level === 'log' ? text : `[${level}] ${text}`),
    clear: () => (output.length = 0),
  };
  const notices: GameNotices = { warn: (text) => output.push(`! ${text}`) };
  let program;
  try {
    program = parseProgram(source);
  } catch (e) {
    return { outcome: { kind: 'error', error: e as Error }, output, farm, stats: { ticks: 0, actions: 0, harvests: 0, instructions: 0 } };
  }
  const run = new ProgramRun({
    program,
    farm,
    console,
    notices,
    mission: options.mission,
    unlockedFunctions: new Set(options.unlockedFunctions),
    unlockHint,
    limits: { ...MISSION_LIMITS, ...options.limits },
    randomSeed: options.randomSeed ?? 1,
    onDiscardedResult: (d) => output.push(`? ${d.sourceText} unused`),
  });
  for (let steps = 0; ; steps++) {
    if (options.stopAfterSteps !== undefined && steps >= options.stopAfterSteps) {
      return { outcome: run.stop(), output, farm, stats: run.stats };
    }
    const step = run.next();
    if (step.type === 'ended') return { outcome: step.outcome, output, farm, stats: run.stats };
  }
}
