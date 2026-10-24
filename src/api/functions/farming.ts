import { ScriptError, formatValue } from '@/interpreter';
import { describePosition, requireCrop } from '../arguments';
import type { ApiFunction } from '../types';

export const FARMING_API: readonly ApiFunction[] = [
  {
    name: 'plant',
    signature: 'plant(seed)',
    returns: 'boolean',
    group: 'Farming',
    isAction: true,
    minArgs: 1,
    maxArgs: 1,
    description: "Plants a seed in empty soil below. Pays the seed price (see getCost) and costs 1 tick. Returns false if it can't plant.",
    example: 'plant("wheat");',
    invoke({ farm, notices }, [seed]) {
      const crop = requireCrop('plant', seed, farm);
      const result = farm.plant(crop);
      if (result.ok) return true;
      notices.warn(`plant("${crop}") did nothing at ${describePosition(farm)}: ${result.reason}.`);
      return false;
    },
  },
  {
    name: 'harvest',
    signature: 'harvest()',
    returns: 'boolean',
    group: 'Farming',
    isAction: true,
    minArgs: 0,
    maxArgs: 0,
    description: 'Harvests the crop below. Ripe crops go to your inventory; unripe crops are destroyed and give nothing. Costs 1 tick.',
    invoke({ farm, notices }) {
      const result = farm.harvest();
      if (!result.ok && result.reason === 'empty') notices.warn(`harvest() found nothing at ${describePosition(farm)}.`);
      if (!result.ok && result.reason === 'unripe')
        notices.warn(`harvest() destroyed an unripe ${result.crop} at ${describePosition(farm)}. Check getCropGrowth() first.`);
      if (result.ok && result.lost)
        notices.warn(`Inventory full: ${result.lost} ${result.crop} lost. Cargo holds ${farm.inventory.capacity} of each crop.`);
      return result.ok;
    },
  },
  {
    name: 'water',
    signature: 'water()',
    returns: 'boolean',
    group: 'Farming',
    isAction: true,
    minArgs: 0,
    maxArgs: 0,
    description: 'Waters the crop below so it grows twice as fast. Crystals only grow when watered. Costs 1 tick.',
    invoke({ farm, notices }) {
      const result = farm.water();
      if (!result.ok) notices.warn(`water() did nothing at ${describePosition(farm)}: ${result.reason}.`);
      return result.ok;
    },
  },
  {
    name: 'wait',
    signature: 'wait(ticks)',
    returns: 'undefined',
    group: 'Farming',
    isAction: true,
    minArgs: 0,
    maxArgs: 1,
    description: 'Hovers in place while time passes. Takes 1 to 1000 ticks; 1 if left out.',
    example: 'wait(8);',
    invoke({ farm }, args) {
      const n = args.length ? args[0] : 1;
      if (typeof n !== 'number' || !Number.isInteger(n) || n < 1 || n > 1000)
        throw new ScriptError(`wait() takes a whole number of ticks from 1 to 1000. Got ${formatValue(n, true)}.`);
      farm.wait(n);
      return undefined;
    },
  },
];
