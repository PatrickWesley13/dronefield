import type { Cost, CropId } from '@/domain/crops';
import type { Farm } from '@/domain/farm';
import type { Point } from '@/domain/geometry';
import type { ProgramFeatures } from '@/interpreter';
import type { Message } from '@/shared/message';

export interface ObjectiveContext {
  readonly farm: Farm;
  readonly features: ProgramFeatures;
}

export interface Objective {
  /** English text. The fallback when the objective has no translation key. */
  readonly description: string;
  /** Catalog key and parameters, so the mission list can be translated. */
  readonly key?: string;
  readonly params?: Readonly<Record<string, string | number>>;
  isMet(ctx: ObjectiveContext): boolean;
}

/** Ends a run early with an explanation, e.g. a destroyed seedling or a time limit. */
export interface FailureRule {
  /** Shown alongside objectives, if the player should know about the rule up front. */
  readonly description?: string;
  check(ctx: ObjectiveContext): Message | null;
}

export interface MissionMap {
  /** Rows from north (top) to south (bottom). See MAP_LEGEND for characters. */
  readonly rows: readonly string[];
}

export interface Mission {
  readonly id: string;
  readonly title: string;
  readonly concept: string;
  readonly briefing: readonly string[];
  /** Drone functions this mission introduces. */
  readonly introduces: readonly string[];
  /** Seeds the drone may plant during the mission. */
  readonly crops: readonly CropId[];
  readonly map: MissionMap;
  readonly drone?: Point;
  readonly inventory?: Partial<Record<CropId, number>>;
  readonly capacity?: number;
  readonly starterCode: string;
  readonly objectives: readonly Objective[];
  readonly failureRules?: readonly FailureRule[];
  readonly reward: Cost;
  /** Completing this mission opens the sandbox farm. */
  readonly unlocksFarm?: boolean;
  readonly tickLimit?: number;
}
