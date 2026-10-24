import type { Cost, CropId } from '@/domain/crops';

/** What the sandbox drone and field look like with a set of upgrades. */
export interface FarmLoadout {
  readonly size: number;
  readonly capacity: number;
  readonly moveCost: number;
  readonly yieldBonus: number;
}

export const BASE_LOADOUT: FarmLoadout = { size: 5, capacity: 50, moveCost: 2, yieldBonus: 0 };

export interface Upgrade {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly cost: Cost;
  readonly requires?: string;
  /** Changes to the sandbox loadout. Upgrades compose in catalog order. */
  readonly modifyLoadout?: (loadout: FarmLoadout) => FarmLoadout;
  readonly unlocksFunction?: string;
  readonly unlocksCrop?: CropId;
}

export const UPGRADES: readonly Upgrade[] = [
  {
    id: 'lens',
    name: 'Ripeness lens',
    description: 'Unlocks canHarvest(), a quick ripeness check.',
    cost: { wheat: 25 },
    unlocksFunction: 'canHarvest',
  },
  {
    id: 'rotors',
    name: 'Turbo rotors',
    description: 'Moving on your farm costs 1 tick instead of 2.',
    cost: { wheat: 40, carrot: 10 },
    modifyLoadout: (l) => ({ ...l, moveCost: 1 }),
  },
  {
    id: 'field1',
    name: 'Field expansion',
    description: 'Grows your farm from 5 × 5 to 7 × 7 tiles.',
    cost: { wheat: 50, carrot: 5 },
    modifyLoadout: (l) => ({ ...l, size: l.size + 2 }),
  },
  {
    id: 'cargo1',
    name: 'Cargo pods',
    description: 'Farm cargo holds 150 of each crop instead of 50.',
    cost: { wheat: 45 },
    modifyLoadout: (l) => ({ ...l, capacity: Math.max(l.capacity, 150) }),
  },
  {
    id: 'sensor',
    name: 'Sensor array',
    description: 'Unlocks scan(direction) to inspect the next tile from afar.',
    cost: { carrot: 20 },
    unlocksFunction: 'scan',
  },
  {
    id: 'crystal',
    name: 'Crystal seeds',
    description: 'Unlocks crystal, a slow crop that only grows when watered.',
    cost: { tomato: 15 },
    unlocksCrop: 'crystal',
  },
  {
    id: 'field2',
    name: 'Field expansion II',
    description: 'Grows your farm to 9 × 9 tiles.',
    cost: { carrot: 30, tomato: 15 },
    requires: 'field1',
    modifyLoadout: (l) => ({ ...l, size: l.size + 2 }),
  },
  {
    id: 'cargo2',
    name: 'Cargo pods II',
    description: 'Farm cargo holds 500 of each crop.',
    cost: { carrot: 40, tomato: 10 },
    requires: 'cargo1',
    modifyLoadout: (l) => ({ ...l, capacity: Math.max(l.capacity, 500) }),
  },
  {
    id: 'blades',
    name: 'Sharp blades',
    description: 'Every harvest on your farm yields 1 extra crop.',
    cost: { tomato: 20, crystal: 2 },
    modifyLoadout: (l) => ({ ...l, yieldBonus: l.yieldBonus + 1 }),
  },
];

export function findUpgrade(id: string): Upgrade | undefined {
  return UPGRADES.find((u) => u.id === id);
}
