import { createApiBindings, type GameNotices } from '@/api';
import type { Farm } from '@/domain/farm';
import {
  Interpreter,
  createStandardLibrary,
  type DiscardedResult,
  type ScriptError,
  type ExecutionLimits,
  type ExecutionSignal,
  type ParsedProgram,
  type ScriptConsole,
  type Value,
} from '@/interpreter';
import { evaluateMission, type Mission, type MissionStatus } from '@/missions';

export type RunOutcome =
  | { readonly kind: 'finished'; readonly status: MissionStatus | null }
  | { readonly kind: 'completed'; readonly status: MissionStatus }
  | { readonly kind: 'failed'; readonly reason: string; readonly line: number | null; readonly status: MissionStatus }
  | { readonly kind: 'error'; readonly error: ScriptError | Error }
  | { readonly kind: 'stopped' };

export type RunStep =
  | { readonly type: 'step'; readonly line: number }
  | { readonly type: 'action'; readonly line: number; readonly status: MissionStatus | null }
  | { readonly type: 'ended'; readonly outcome: RunOutcome };

export interface RunStats {
  readonly ticks: number;
  readonly actions: number;
  readonly harvests: number;
  readonly instructions: number;
}

export interface RunDependencies {
  readonly program: ParsedProgram;
  readonly farm: Farm;
  readonly unlockedFunctions: ReadonlySet<string>;
  readonly unlockHint: (name: string) => string;
  readonly console: ScriptConsole;
  readonly notices: GameNotices;
  readonly limits: ExecutionLimits;
  readonly randomSeed: number;
  /** When set, objectives and failure rules are checked after every action. */
  readonly mission?: Mission;
  readonly onDiscardedResult?: (info: DiscardedResult) => void;
}

/**
 * One execution of a program against a farm. Advances one interpreter signal at
 * a time and turns it into game-level steps; knows nothing about time or rendering.
 */
export class ProgramRun {
  private readonly interpreter: Interpreter;
  private readonly execution: Generator<ExecutionSignal, void, void>;
  private readonly start: { tick: number; actions: number; harvests: number };
  private ended: RunOutcome | null = null;
  private lastLine: number | null = null;

  constructor(private readonly deps: RunDependencies) {
    const { farm } = deps;
    const api = createApiBindings({ farm, notices: deps.notices }, deps.unlockedFunctions, deps.unlockHint);
    const globals = new Map<string, Value>([
      ...createStandardLibrary({ console: deps.console, randomSeed: deps.randomSeed }),
      ...api.globals,
    ]);
    this.interpreter = new Interpreter(deps.program, {
      globals,
      lockedNames: api.locked,
      limits: deps.limits,
      progress: () => farm.tick,
      onDiscardedResult: deps.onDiscardedResult,
    });
    this.execution = this.interpreter.run();
    this.start = { tick: farm.tick, actions: farm.stats.actions, harvests: farm.stats.harvests };
  }

  get isEnded(): boolean {
    return this.ended !== null;
  }

  get outcome(): RunOutcome | null {
    return this.ended;
  }

  get currentLine(): number | null {
    return this.lastLine;
  }

  get stats(): RunStats {
    const { farm } = this.deps;
    return {
      ticks: farm.tick - this.start.tick,
      actions: farm.stats.actions - this.start.actions,
      harvests: farm.stats.harvests - this.start.harvests,
      instructions: this.interpreter.instructionCount,
    };
  }

  next(): RunStep {
    if (this.ended) return { type: 'ended', outcome: this.ended };
    let result: IteratorResult<ExecutionSignal, void>;
    try {
      result = this.execution.next();
    } catch (e) {
      return this.end({ kind: 'error', error: e instanceof Error ? e : new Error(String(e)) });
    }
    if (result.done) return this.end({ kind: 'finished', status: this.evaluate() });
    const signal = result.value;
    this.lastLine = signal.line;
    if (signal.kind === 'step') return { type: 'step', line: signal.line };
    const status = this.evaluate();
    if (status?.failure) return this.end({ kind: 'failed', reason: status.failure, line: signal.line, status });
    if (status?.complete) return this.end({ kind: 'completed', status });
    return { type: 'action', line: signal.line, status };
  }

  stop(): RunOutcome {
    if (this.ended) return this.ended;
    this.execution.return();
    return this.end({ kind: 'stopped' }).outcome;
  }

  private evaluate(): MissionStatus | null {
    const { mission, farm, program } = this.deps;
    return mission ? evaluateMission(mission, { farm, features: program.features }) : null;
  }

  private end(outcome: RunOutcome): { type: 'ended'; outcome: RunOutcome } {
    if (outcome.kind === 'finished' && outcome.status?.complete) outcome = { kind: 'completed', status: outcome.status };
    if (outcome.kind !== 'stopped' && outcome.kind !== 'error') this.execution.return();
    this.ended = outcome;
    return { type: 'ended', outcome };
  }
}
