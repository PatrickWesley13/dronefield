import type { SoundName, SoundPlayer } from '@/audio/soundPlayer';
import type { Farm, FarmEvent } from '@/domain/farm';
import type { InventorySnapshot } from '@/domain/inventory';
import type { CropId, Cost } from '@/domain/crops';
import type { Point } from '@/domain/geometry';
import { formatValue, isScriptError, parseProgram, type ParsedProgram } from '@/interpreter';
import { MISSIONS, createMissionFarm, evaluateMission, missionIndex, type MissionStatus, type Objective } from '@/missions';
import { SANDBOX_ID, createDefaultSave, type SaveData, type SaveRepository, type Settings } from '@/persistence';
import {
  clearSandboxField,
  createSandboxFarm,
  enterMission,
  isMissionUnlocked,
  isSandboxUnlocked,
  purchaseUpgrade,
  recordCompletion,
  recordRun,
  storeSandboxFarm,
  unlockHint,
} from '@/progression';
import {
  MISSION_LIMITS,
  Playback,
  ProgramRun,
  SANDBOX_LIMITS,
  speedOption,
  type PlaybackState,
  type RunOutcome,
  type RunStats,
} from '@/runtime';
import { Emitter } from '@/shared/emitter';
import { msg, type Message } from '@/shared/message';
import { ConsoleLog } from './consoleLog';
import { resolveLevel, starterCode, type Level } from './levels';

export type RunStatus = 'idle' | 'running' | 'paused' | 'finished' | 'complete' | 'failed' | 'error' | 'stopped';

export interface CompletedRun extends RunStats {
  readonly elapsedMs: number;
}

function objectiveMessage(objective: Objective): Message {
  return msg(objective.key ?? 'objective.text', objective.description, objective.params);
}

export interface RunReport {
  readonly tone: 'success' | 'problem';
  readonly title: Message;
  readonly message: Message | null;
  readonly stats: CompletedRun;
  readonly reward: Cost | null;
  readonly unlockedSandbox: boolean;
  readonly nextLevelId: string | null;
  readonly pending?: readonly Message[];
}

export interface HudState {
  readonly tick: number;
  readonly drone: Point;
  readonly inventory: InventorySnapshot;
  readonly capacity: number;
  readonly unlockedCrops: readonly CropId[];
  readonly actions: number | null;
  readonly instructions: number | null;
}

/** Everything the UI renders, as one immutable value. */
export interface GameSnapshot {
  readonly save: SaveData;
  readonly level: Level;
  readonly code: string;
  readonly status: RunStatus;
  readonly playback: PlaybackState | null;
  readonly missionStatus: MissionStatus | null;
  readonly executingLine: number | null;
  readonly errorLine: number | null;
  readonly lastRun: CompletedRun | null;
  readonly report: RunReport | null;
  readonly hud: HudState;
  readonly toast: { readonly id: number; readonly message: Message } | null;
}

export interface GameControllerDeps {
  readonly repository: SaveRepository;
  readonly sound: SoundPlayer;
  readonly now?: () => number;
}

const SOUND_FOR: Partial<Record<FarmEvent['type'], SoundName>> = {
  moved: 'move',
  bumped: 'bump',
  harvested: 'harvest',
  planted: 'plant',
  watered: 'water',
  destroyed: 'bump',
};
const FX_MIN_ACTION_MS = 18;
const SANDBOX_AUTOSAVE_MS = 2500;

/**
 * Application service: coordinates progression, the farm, program runs and
 * persistence, and exposes a snapshot for the UI. The UI never mutates game state directly.
 */
export class GameController {
  readonly log = new ConsoleLog();
  /** Fires when the farm instance is replaced (new level, reset, run start). */
  readonly farmReplaced = new Emitter<Farm>();
  /** Re-broadcast of the current farm's events, for renderers and effects. */
  readonly farmEvents = new Emitter<FarmEvent>();

  private save: SaveData;
  private level: Level;
  private farm!: Farm;
  private unsubscribeFarm: () => void = () => {};
  private run: ProgramRun | null = null;
  private playback: Playback | null = null;
  private status: RunStatus = 'idle';
  private missionStatus: MissionStatus | null = null;
  private executingLine: number | null = null;
  private errorLine: number | null = null;
  private lastRun: CompletedRun | null = null;
  private report: RunReport | null = null;
  private toast: GameSnapshot['toast'] = null;
  private toastId = 0;
  private lastAutosave = 0;
  private snapshot!: GameSnapshot;
  private readonly changes = new Emitter<void>();
  private readonly now: () => number;

  constructor(private readonly deps: GameControllerDeps) {
    this.now = deps.now ?? (() => performance.now());
    const loaded = deps.repository.load();
    this.save = loaded.save;
    this.level = this.initialLevel();
    this.enterLevel(this.level);
    if (loaded.notice) this.showToast(msg('toast.notice', loaded.notice));
    this.refresh();
  }

  // ------------------------------------------------------------------ observation
  subscribe = (listener: () => void): (() => void) => this.changes.subscribe(listener);
  getSnapshot = (): GameSnapshot => this.snapshot;
  get currentFarm(): Farm {
    return this.farm;
  }

  // ------------------------------------------------------------------ levels
  selectLevel(id: string): void {
    const level = resolveLevel(id);
    if (!level || !this.isLevelAvailable(level)) return;
    this.stopSilently();
    this.level = level;
    this.enterLevel(level);
    this.log.clear();
    this.log.addMessage(
      'info',
      level.kind === 'sandbox'
        ? msg('log.openFarmLoaded', 'Open farm loaded. Crops you harvest here are kept.')
        : msg('log.missionLoaded', "Mission loaded: {title}. Press Run when you're ready.", { title: level.mission.title }),
    );
    this.refresh();
  }

  isLevelAvailable(level: Level): boolean {
    return level.kind === 'sandbox' ? isSandboxUnlocked(this.save) : isMissionUnlocked(this.save, level.id);
  }

  // ------------------------------------------------------------------ code
  setCode(code: string): void {
    if (this.save.code[this.level.id] === code) return;
    this.updateSave({ ...this.save, code: { ...this.save.code, [this.level.id]: code } });
    if (this.errorLine !== null) this.errorLine = null;
    this.refresh();
  }

  restoreStarterCode(): void {
    const { [this.level.id]: _removed, ...rest } = this.save.code;
    this.updateSave({ ...this.save, code: rest });
    this.refresh();
  }

  // ------------------------------------------------------------------ running
  /** Run, or pause/resume the current run. */
  toggleRun(): void {
    if (!this.playback) this.start(false);
    else if (this.playback.state === 'running') this.playback.pause();
    else this.playback.resume();
    this.syncStatus();
    this.refresh();
  }

  stepLine(): void {
    if (!this.playback && !this.start(true)) return;
    this.playback?.stepLine();
    this.syncStatus();
    this.refresh();
  }

  stop(): void {
    this.playback?.stop();
  }

  /** Advance playback; call once per animation frame. */
  frame(): void {
    if (!this.playback) return;
    this.playback.update();
    if (this.playback && this.level.kind === 'sandbox' && this.now() - this.lastAutosave > SANDBOX_AUTOSAVE_MS) {
      this.lastAutosave = this.now();
      this.updateSave(storeSandboxFarm(this.save, this.farm));
    }
    if (this.playback) this.refresh();
  }

  resetField(): void {
    if (this.playback) return;
    if (this.level.kind === 'sandbox') this.updateSave(clearSandboxField(this.save));
    this.replaceFarm(this.buildFarm(this.level));
    this.status = 'idle';
    this.errorLine = null;
    this.report = null;
    this.log.addMessage(
      'info',
      this.level.kind === 'sandbox'
        ? msg('log.fieldCleared', 'Field cleared.')
        : msg('log.fieldReset', 'Field reset to the mission start.'),
    );
    this.refresh();
  }

  dismissReport(): void {
    this.report = null;
    this.refresh();
  }

  // ------------------------------------------------------------------ progression & settings
  buyUpgrade(id: string): void {
    if (this.playback) return;
    if (this.level.kind === 'sandbox') this.save = storeSandboxFarm(this.save, this.farm);
    const result = purchaseUpgrade(this.save, id);
    if (!result.ok) {
      this.showToast(msg('toast.purchaseFailed', result.reason));
      this.refresh();
      return;
    }
    this.updateSave(result.save);
    this.deps.sound.play('buy');
    this.showToast(msg('toast.upgradeInstalled', 'Upgrade installed.'));
    if (this.level.kind === 'sandbox') this.replaceFarm(this.buildFarm(this.level));
    this.refresh();
  }

  updateSettings(patch: Partial<Settings>): void {
    this.updateSave({ ...this.save, settings: { ...this.save.settings, ...patch } });
    this.refresh();
  }

  completeTutorial(): void {
    if (this.save.tutorialDone) return;
    this.updateSave({ ...this.save, tutorialDone: true });
    this.refresh();
  }

  resetProgress(): void {
    this.stopSilently();
    const settings = this.save.settings;
    this.save = { ...createDefaultSave(), settings, tutorialDone: true };
    this.deps.repository.save(this.save);
    this.level = resolveLevel('m1') as Level;
    this.enterLevel(this.level);
    this.log.clear();
    this.showToast(msg('toast.progressReset', 'Progress reset.'));
    this.refresh();
  }

  /** Persist everything now (e.g. before the page unloads). */
  flush(): void {
    if (this.level.kind === 'sandbox') this.save = storeSandboxFarm(this.save, this.farm);
    this.deps.repository.save(this.save);
    this.deps.repository.flush?.();
  }

  // ------------------------------------------------------------------ internals
  private initialLevel(): Level {
    const saved = resolveLevel(this.save.currentLevel);
    return saved && this.isLevelAvailable(saved) ? saved : (resolveLevel(MISSIONS[0]!.id) as Level);
  }

  private enterLevel(level: Level): void {
    if (level.kind === 'mission') this.updateSave(enterMission(this.save, level.mission));
    else this.updateSave({ ...this.save, currentLevel: SANDBOX_ID });
    this.status = 'idle';
    this.errorLine = null;
    this.executingLine = null;
    this.lastRun = null;
    this.report = null;
    this.replaceFarm(this.buildFarm(level));
  }

  private buildFarm(level: Level): Farm {
    return level.kind === 'sandbox' ? createSandboxFarm(this.save) : createMissionFarm(level.mission);
  }

  private replaceFarm(farm: Farm): void {
    this.unsubscribeFarm();
    this.farm = farm;
    this.unsubscribeFarm = farm.events.subscribe((e) => {
      this.farmEvents.emit(e);
      const sound = SOUND_FOR[e.type];
      if (sound && (e.type === 'destroyed' || speedOption(this.save.settings.speed).actionMs >= FX_MIN_ACTION_MS))
        this.deps.sound.play(sound);
    });
    this.missionStatus =
      this.level.kind === 'mission'
        ? evaluateMission(this.level.mission, { farm, features: { usesLoop: false, usesFunction: false, usesCondition: false } })
        : null;
    this.farmReplaced.emit(farm);
  }

  private start(paused: boolean): boolean {
    this.report = null;
    this.errorLine = null;
    let program: ParsedProgram;
    try {
      program = parseProgram(this.currentCode());
    } catch (e) {
      this.reportError(e);
      this.status = 'error';
      this.refresh();
      return false;
    }
    if (this.level.kind === 'mission') this.replaceFarm(this.buildFarm(this.level));
    const flagged = new Set<number | null>();
    const isSandbox = this.level.kind === 'sandbox';
    this.run = new ProgramRun({
      program,
      farm: this.farm,
      mission: this.level.kind === 'mission' ? this.level.mission : undefined,
      unlockedFunctions: new Set(this.save.unlockedFunctions),
      unlockHint,
      console: this.log.scriptConsole,
      notices: this.log.notices,
      limits: isSandbox ? SANDBOX_LIMITS : MISSION_LIMITS,
      randomSeed: isSandbox ? this.farm.tick + 1 : 1,
      onDiscardedResult: (d) => {
        if (flagged.has(d.line)) return;
        flagged.add(d.line);
        this.log.add(
          'hint',
          `${d.name}() returned ${formatValue(d.value, true)}, but nothing used the result. To see it, write console.log(${d.sourceText}).`,
          d.line,
        );
      },
    });
    this.playback = new Playback(
      this.run,
      {
        onStep: (step) => {
          this.executingLine = step.line;
          if (step.type === 'action' && step.status) this.missionStatus = step.status;
        },
        onEnded: (outcome) => this.finish(outcome),
      },
      { actionDuration: () => speedOption(this.save.settings.speed).actionMs, now: this.now },
      paused,
    );
    this.lastAutosave = this.now();
    this.log.addMessage('info', paused ? msg('log.runStartedStep', 'Run started in step mode.') : msg('log.runStarted', 'Run started.'));
    this.syncStatus();
    return true;
  }

  private finish(outcome: RunOutcome): void {
    const run = this.run!;
    const stats: CompletedRun = { ...run.stats, elapsedMs: Math.round(this.playback?.elapsedMs ?? 0) };
    const line = run.currentLine;
    this.run = null;
    this.playback = null;
    this.executingLine = null;
    this.lastRun = stats;
    let save = recordRun(this.save, stats);
    const level = this.level;

    switch (outcome.kind) {
      case 'error':
        this.reportError(outcome.error);
        this.status = 'error';
        break;
      case 'stopped':
        this.log.add('info', 'Stopped.');
        this.status = 'stopped';
        break;
      case 'failed':
        this.log.add('error', `Mission failed: ${outcome.reason}`, outcome.line ?? line);
        this.missionStatus = outcome.status;
        this.status = 'failed';
        this.deps.sound.play('error');
        this.report = {
          tone: 'problem',
          title: msg('report.missionFailed', 'Mission failed'),
          message: outcome.reason,
          stats,
          reward: null,
          unlockedSandbox: false,
          nextLevelId: null,
        };
        break;
      case 'finished':
        this.status = 'finished';
        if (level.kind === 'mission' && outcome.status) {
          this.missionStatus = outcome.status;
          const pendingObjectives = level.mission.objectives.filter((_, i) => !outcome.status?.objectivesMet[i]);
          const pendingMessages = pendingObjectives.map(objectiveMessage);
          const items = pendingObjectives.map((o) => o.description.toLowerCase()).join('; ');
          this.log.add('warn', `Program finished, but the mission isn't done yet. Still to do: ${items}.`);
          this.report = {
            tone: 'problem',
            title: msg('report.notDone', 'Not quite'),
            message: msg('report.stillToDo', `Your program ended before every objective was met. Still to do: ${items}.`),
            pending: pendingMessages,
            stats,
            reward: null,
            unlockedSandbox: false,
            nextLevelId: null,
          };
        } else this.log.add('success', 'Program finished.');
        break;
      case 'completed': {
        if (level.kind !== 'mission') break;
        this.missionStatus = outcome.status;
        const sandboxBefore = isSandboxUnlocked(save);
        const result = recordCompletion(save, level.mission, stats);
        save = result.save;
        this.status = 'complete';
        this.deps.sound.play('win');
        this.log.add('success', `Mission complete: ${level.mission.title}.`);
        const next = MISSIONS[missionIndex(level.id) + 1];
        const message = result.firstTime
          ? undefined
          : result.newBest
            ? msg('report.newBest', `New best: ${stats.ticks} ticks (was ${result.previousBest?.ticks}).`, {
                ticks: stats.ticks,
                previous: result.previousBest?.ticks ?? 0,
              })
            : msg('report.bestSoFar', `Best so far: ${save.best[level.id]?.ticks} ticks.`, { ticks: save.best[level.id]?.ticks ?? 0 });
        this.report = {
          tone: 'success',
          title: next ? msg('report.missionComplete', 'Mission complete') : msg('report.everyMissionComplete', 'Every mission complete'),
          message: message ?? null,
          stats,
          reward: result.firstTime ? level.mission.reward : null,
          unlockedSandbox: !sandboxBefore && isSandboxUnlocked(save),
          nextLevelId: next?.id ?? (isSandboxUnlocked(save) ? SANDBOX_ID : null),
        };
        break;
      }
    }
    const best = level.kind === 'mission' ? save.best[level.id] : undefined;
    this.log.add(
      'summary',
      `Run: ${stats.ticks.toLocaleString('en-US')} ticks, ${stats.actions.toLocaleString('en-US')} actions, ${stats.instructions.toLocaleString('en-US')} instructions, ${stats.harvests} harvests, ${(stats.elapsedMs / 1000).toFixed(1)} s${best ? ` (best: ${best.ticks.toLocaleString('en-US')} ticks)` : ''}`,
    );
    if (level.kind === 'sandbox') save = storeSandboxFarm(save, this.farm);
    this.updateSave(save);
    this.refresh();
  }

  private stopSilently(): void {
    if (!this.playback) return;
    this.playback.stop();
  }

  private reportError(e: unknown): void {
    if (isScriptError(e)) {
      this.log.add('error', e.message, e.line);
      this.errorLine = e.line;
    } else {
      this.log.add('error', `Something went wrong inside the game: ${e instanceof Error ? e.message : String(e)}`);
      console.error(e);
    }
    this.deps.sound.play('error');
  }

  private syncStatus(): void {
    const s = this.playback?.state;
    if (s === 'running') this.status = 'running';
    else if (s === 'paused') this.status = 'paused';
  }

  private currentCode(): string {
    return this.save.code[this.level.id] ?? starterCode(this.level);
  }

  private updateSave(next: SaveData): void {
    this.save = next;
    this.deps.repository.save(next);
  }

  private showToast(message: Message): void {
    this.toast = { id: ++this.toastId, message };
  }

  private refresh(): void {
    const farm = this.farm;
    const running = this.run;
    this.snapshot = {
      save: this.save,
      level: this.level,
      code: this.currentCode(),
      status: this.status,
      playback: this.playback?.state ?? null,
      missionStatus: this.missionStatus,
      executingLine:
        this.playback?.state === 'paused' || (this.playback && speedOption(this.save.settings.speed).actionMs >= FX_MIN_ACTION_MS)
          ? this.executingLine
          : null,
      errorLine: this.errorLine,
      lastRun: this.lastRun,
      report: this.report,
      hud: {
        tick: farm.tick,
        drone: farm.drone,
        inventory: farm.inventory.snapshot(),
        capacity: farm.inventory.capacity,
        unlockedCrops: [...farm.unlockedCrops],
        actions: running ? running.stats.actions : null,
        instructions: running ? running.stats.instructions : null,
      },
      toast: this.toast,
    };
    this.changes.emit();
  }
}
