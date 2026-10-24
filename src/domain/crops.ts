export type CropId = 'wheat' | 'carrot' | 'tomato' | 'crystal';
export type Cost = Readonly<Partial<Record<CropId, number>>>;

export interface CropDefinition {
  readonly id: CropId;
  readonly label: string;
  readonly plural: string;
  /** Growth points needed to ripen. */
  readonly growTime: number;
  readonly cost: Cost;
  readonly yield: number;
  /** Growth points gained per tick. New growth rules are added here, not in the farm. */
  growthPerTick(watered: boolean): number;
}

const standardGrowth = (watered: boolean): number => (watered ? 2 : 1);

export const CROPS: Readonly<Record<CropId, CropDefinition>> = {
  wheat: { id: 'wheat', label: 'Wheat', plural: 'wheat', growTime: 8, cost: {}, yield: 1, growthPerTick: standardGrowth },
  carrot: { id: 'carrot', label: 'Carrot', plural: 'carrots', growTime: 16, cost: { wheat: 2 }, yield: 1, growthPerTick: standardGrowth },
  tomato: { id: 'tomato', label: 'Tomato', plural: 'tomatoes', growTime: 30, cost: { carrot: 2 }, yield: 2, growthPerTick: standardGrowth },
  crystal: {
    id: 'crystal',
    label: 'Crystal',
    plural: 'crystals',
    growTime: 60,
    cost: { tomato: 3 },
    yield: 1,
    growthPerTick: (watered) => (watered ? 2 : 0),
  },
};

export const CROP_IDS = Object.keys(CROPS) as CropId[];

export function isCropId(value: unknown): value is CropId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(CROPS, value);
}

export function costEntries(cost: Cost): Array<[CropId, number]> {
  return CROP_IDS.filter((id) => (cost[id] ?? 0) > 0).map((id) => [id, cost[id] ?? 0]);
}
