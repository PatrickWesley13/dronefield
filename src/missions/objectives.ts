import { CROPS, type CropId } from '@/domain/crops';
import type { Message } from '@/shared/message';
import { parseMap } from './mapParser';
import type { FailureRule, MissionMap, Objective } from './types';

const plural = (n: number, id: CropId): string => `${n} ${n === 1 ? CROPS[id].label.toLowerCase() : CROPS[id].plural}`;

export const reachBeacon = (description = 'Reach the beacon', key = 'objective.beacon'): Objective => ({
  description,
  key,
  isMet: ({ farm }) => farm.isAtBeacon(),
});

export const haveAtLeast = (crop: CropId, amount: number, verb: 'Have' | 'Collect' = 'Have'): Objective => ({
  description: `${verb} ${plural(amount, crop)}`,
  key: verb === 'Collect' ? 'objective.collect' : 'objective.have',
  params: { count: amount, crop: CROPS[crop].plural },
  isMet: ({ farm }) => farm.inventory.get(crop) >= amount,
});

export const harvestAtLeast = (count: number, description = `Harvest ${count} crops`): Objective => ({
  description,
  key: 'objective.harvest',
  params: { count },
  isMet: ({ farm }) => farm.stats.harvests >= count,
});

export const usesLoop = (): Objective => ({
  description: 'Use a loop',
  key: 'objective.loop',
  isMet: ({ features }) => features.usesLoop,
});

export const usesFunction = (): Objective => ({
  description: 'Define and use a function',
  key: 'objective.function',
  isMet: ({ features }) => features.usesFunction,
});

export const nothingDestroyed = (description = 'Leave every seedling standing'): Objective => ({
  description,
  key: 'objective.nothingDestroyed',
  isMet: ({ farm }) => farm.stats.destroyed === 0,
});

/** Every tile that started with a crop holds that same crop type again. */
export function replantedAsOriginal(map: MissionMap): Objective {
  const original = parseMap(map).crops;
  return {
    description: 'Replant every tile with its original crop',
    key: 'objective.replanted',
    isMet: ({ farm }) => original.every((c) => farm.tileAt(c)?.crop?.type === c.type),
  };
}

/** Ends the run when a seedling is destroyed. `fallback` is the English text. */
export const failIfDestroyed = (fallback: string): FailureRule => ({
  check: ({ farm }) => (farm.stats.destroyed > 0 ? { key: 'failure.destroyed', fallback } : null),
});

export const tickLimit = (limit: number): FailureRule => {
  const fallback = `Out of time: the mission allows ${limit.toLocaleString('en-US')} ticks.`;
  const message: Message = { key: 'failure.outOfTime', params: { limit: limit.toLocaleString('en-US') }, fallback };
  return {
    description: `Finish within ${limit.toLocaleString('en-US')} ticks`,
    check: ({ farm }) => (farm.tick > limit ? message : null),
  };
};
