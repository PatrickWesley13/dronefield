import { CROPS, type CropId } from '@/domain/crops';
import { parseMap } from './mapParser';
import type { FailureRule, MissionMap, Objective } from './types';

const plural = (n: number, id: CropId): string => `${n} ${n === 1 ? CROPS[id].label.toLowerCase() : CROPS[id].plural}`;

export const reachBeacon = (description = 'Reach the beacon'): Objective => ({
  description,
  isMet: ({ farm }) => farm.isAtBeacon(),
});

export const haveAtLeast = (crop: CropId, amount: number, verb: 'Have' | 'Collect' = 'Have'): Objective => ({
  description: `${verb} ${plural(amount, crop)}`,
  isMet: ({ farm }) => farm.inventory.get(crop) >= amount,
});

export const harvestAtLeast = (count: number, description = `Harvest ${count} crops`): Objective => ({
  description,
  isMet: ({ farm }) => farm.stats.harvests >= count,
});

export const usesLoop = (): Objective => ({ description: 'Use a loop', isMet: ({ features }) => features.usesLoop });
export const usesFunction = (): Objective => ({ description: 'Define and use a function', isMet: ({ features }) => features.usesFunction });

export const nothingDestroyed = (description = 'Leave every seedling standing'): Objective => ({
  description,
  isMet: ({ farm }) => farm.stats.destroyed === 0,
});

/** Every tile that started with a crop holds that same crop type again. */
export function replantedAsOriginal(map: MissionMap): Objective {
  const original = parseMap(map).crops;
  return {
    description: 'Replant every tile with its original crop',
    isMet: ({ farm }) => original.every((c) => farm.tileAt(c)?.crop?.type === c.type),
  };
}

export const failIfDestroyed = (message: string): FailureRule => ({
  check: ({ farm }) => (farm.stats.destroyed > 0 ? message : null),
});

export const tickLimit = (limit: number): FailureRule => ({
  description: `Finish within ${limit.toLocaleString('en-US')} ticks`,
  check: ({ farm }) => (farm.tick > limit ? `Out of time: the mission allows ${limit.toLocaleString('en-US')} ticks.` : null),
});
