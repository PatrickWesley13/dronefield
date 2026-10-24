import { CROPS, CROP_IDS } from '@/domain/crops';
import { createObject } from '@/interpreter';
import { requireCrop } from '../arguments';
import type { ApiFunction } from '../types';

export const RESOURCES_API: readonly ApiFunction[] = [
  {
    name: 'getInventory',
    signature: 'getInventory()',
    returns: 'object',
    group: 'Resources',
    isAction: false,
    minArgs: 0,
    maxArgs: 0,
    description: 'Your crops so far, like { wheat: 4, carrot: 0 }.',
    example: 'const { wheat } = getInventory();\nif (wheat >= 2) plant("carrot");',
    invoke({ farm }) {
      const inv = createObject();
      for (const id of CROP_IDS) if (farm.unlockedCrops.has(id) || farm.inventory.get(id) > 0) inv[id] = farm.inventory.get(id);
      return inv;
    },
  },
  {
    name: 'getCost',
    signature: 'getCost(seed)',
    returns: 'object',
    group: 'Resources',
    isAction: false,
    minArgs: 1,
    maxArgs: 1,
    description: 'What one seed costs. getCost("carrot") is { wheat: 2 }.',
    invoke: (_ctx, [seed]) => createObject({ ...CROPS[requireCrop('getCost', seed, null)].cost }),
  },
  {
    name: 'getUnlockedCrops',
    signature: 'getUnlockedCrops()',
    returns: 'array',
    group: 'Resources',
    isAction: false,
    minArgs: 0,
    maxArgs: 0,
    description: 'The seeds you can plant, like ["wheat", "carrot"].',
    invoke: ({ farm }) => CROP_IDS.filter((id) => farm.unlockedCrops.has(id)),
  },
  {
    name: 'getTickCount',
    signature: 'getTickCount()',
    returns: 'number',
    group: 'Resources',
    isAction: false,
    minArgs: 0,
    maxArgs: 0,
    description: 'Ticks of farm time so far. Every action takes ticks, and crops grow by ticks.',
    invoke: ({ farm }) => farm.tick,
  },
];
