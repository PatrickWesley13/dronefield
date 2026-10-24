import type { CropId } from '@/domain/crops';
import type { FarmSnapshot } from '@/domain/farmSnapshot';

export const SAVE_VERSION = 2;

export type MotionPreference = 'auto' | 'full' | 'reduced';
export type ThemePreference = 'system' | 'light' | 'dark';
export type SpeedLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface Settings {
  readonly speed: SpeedLevel;
  readonly sound: boolean;
  readonly motion: MotionPreference;
  readonly showCoordinates: boolean;
  readonly theme: ThemePreference;
}

export interface BestRun {
  readonly ticks: number;
  readonly actions: number;
  readonly instructions: number;
}

export interface LifetimeStats {
  readonly runs: number;
  readonly harvests: number;
  readonly actions: number;
  readonly instructions: number;
}

/** Everything persisted for a player. Immutable: updates produce a new object. */
export interface SaveData {
  readonly version: typeof SAVE_VERSION;
  readonly completed: Readonly<Record<string, true>>;
  readonly unlockedFunctions: readonly string[];
  readonly unlockedCrops: readonly CropId[];
  readonly bank: Readonly<Record<CropId, number>>;
  readonly upgrades: Readonly<Record<string, true>>;
  /** A mission id, or SANDBOX_ID. */
  readonly currentLevel: string;
  readonly code: Readonly<Record<string, string>>;
  readonly best: Readonly<Record<string, BestRun>>;
  readonly farm: FarmSnapshot | null;
  readonly settings: Settings;
  readonly tutorialDone: boolean;
  readonly lifetime: LifetimeStats;
}

export const SANDBOX_ID = 'farm';

export const DEFAULT_SETTINGS: Settings = { speed: 3, sound: true, motion: 'auto', showCoordinates: true, theme: 'system' };

export function createDefaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    completed: {},
    unlockedFunctions: ['move'],
    unlockedCrops: ['wheat'],
    bank: { wheat: 0, carrot: 0, tomato: 0, crystal: 0 },
    upgrades: {},
    currentLevel: 'm1',
    code: {},
    best: {},
    farm: null,
    settings: DEFAULT_SETTINGS,
    tutorialDone: false,
    lifetime: { runs: 0, harvests: 0, actions: 0, instructions: 0 },
  };
}
