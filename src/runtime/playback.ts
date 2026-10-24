import type { ProgramRun, RunOutcome, RunStep } from './programRun';

export type PlaybackState = 'running' | 'paused' | 'ended';

export interface PlaybackListener {
  /** A step that the player should see (line highlight, action animation). */
  onStep?(step: Exclude<RunStep, { type: 'ended' }>): void;
  onEnded?(outcome: RunOutcome): void;
}

export interface PlaybackOptions {
  /** Milliseconds each action is given on screen; 0 runs as fast as possible. */
  readonly actionDuration: () => number;
  /** Longest slice of a frame spent executing before yielding back to the browser. */
  readonly frameBudgetMs?: number;
  /** Hard cap on interpreter steps per update, so a frame stays bounded whatever the clock says. */
  readonly maxStepsPerUpdate?: number;
  readonly now?: () => number;
}

/**
 * Drives a ProgramRun over time. Call `update()` once per animation frame.
 * Speed only changes pacing, never the result: the same steps run in the same order.
 */
export class Playback {
  private mode: PlaybackState;
  private busyUntil = 0;
  private startedAt: number;
  private pausedAt: number | null;
  private pausedTotal = 0;
  private readonly now: () => number;

  constructor(
    private readonly run: ProgramRun,
    private readonly listener: PlaybackListener,
    private readonly options: PlaybackOptions,
    startPaused = false,
  ) {
    this.now = options.now ?? (() => performance.now());
    this.startedAt = this.now();
    this.mode = startPaused ? 'paused' : 'running';
    this.pausedAt = startPaused ? this.startedAt : null;
  }

  get state(): PlaybackState {
    return this.mode;
  }

  /** Wall-clock time spent running, excluding pauses. */
  get elapsedMs(): number {
    const end = this.pausedAt ?? this.now();
    return Math.max(0, end - this.startedAt - this.pausedTotal);
  }

  update(): void {
    if (this.mode !== 'running') return;
    const now = this.now();
    if (now < this.busyUntil) return;
    const duration = this.options.actionDuration();
    const deadline = now + (this.options.frameBudgetMs ?? 9);
    const maxSteps = this.options.maxStepsPerUpdate ?? 50_000;
    for (let n = 1; this.mode === 'running' && n <= maxSteps; n++) {
      const step = this.advance();
      if (!step) break;
      if (step.type === 'action' && duration > 0) {
        this.busyUntil = now + duration;
        break;
      }
      if ((n & 127) === 0 && this.now() > deadline) break;
    }
  }

  /** Runs until the next statement starts (passing through any actions on the way). */
  stepLine(): void {
    if (this.mode === 'ended') return;
    if (this.mode === 'running') this.pause();
    for (let guard = 0; guard < 100_000; guard++) {
      const step = this.advance();
      if (!step || step.type === 'step') return;
    }
  }

  pause(): void {
    if (this.mode !== 'running') return;
    this.mode = 'paused';
    this.pausedAt = this.now();
  }

  resume(): void {
    if (this.mode !== 'paused') return;
    if (this.pausedAt !== null) this.pausedTotal += this.now() - this.pausedAt;
    this.pausedAt = null;
    this.mode = 'running';
  }

  stop(): void {
    if (this.mode === 'ended') return;
    this.finish(this.run.stop());
  }

  private advance(): Exclude<RunStep, { type: 'ended' }> | null {
    const step = this.run.next();
    if (step.type === 'ended') {
      this.finish(step.outcome);
      return null;
    }
    this.listener.onStep?.(step);
    return step;
  }

  private finish(outcome: RunOutcome): void {
    if (this.pausedAt === null) this.pausedAt = this.now();
    this.mode = 'ended';
    this.listener.onEnded?.(outcome);
  }
}
