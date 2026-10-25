import { Farm } from '@/domain/farm';
import type { Message } from '@/shared/message';
import { farmConfigFromMap } from './mapParser';
import type { Mission, ObjectiveContext } from './types';

export interface MissionStatus {
  readonly objectivesMet: readonly boolean[];
  readonly complete: boolean;
  readonly failure: Message | null;
}

export function evaluateMission(mission: Mission, ctx: ObjectiveContext): MissionStatus {
  const failure = (mission.failureRules ?? []).map((r) => r.check(ctx)).find((m) => m !== null) ?? null;
  const objectivesMet = mission.objectives.map((o) => o.isMet(ctx));
  return { objectivesMet, failure, complete: !failure && objectivesMet.every(Boolean) };
}

/** A fresh farm in the mission's starting state, with a standard (un-upgraded) drone. */
export function createMissionFarm(mission: Mission): Farm {
  return new Farm({
    ...farmConfigFromMap(mission.map),
    drone: mission.drone ?? { x: 0, y: 0 },
    inventory: mission.inventory ?? {},
    capacity: mission.capacity ?? 50,
    unlockedCrops: mission.crops,
    moveCost: 2,
  });
}
