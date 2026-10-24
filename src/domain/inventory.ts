import { CROP_IDS, costEntries, type Cost, type CropId } from './crops';

export type InventorySnapshot = Readonly<Record<CropId, number>>;

export function emptyInventory(): Record<CropId, number> {
  return Object.fromEntries(CROP_IDS.map((id) => [id, 0])) as Record<CropId, number>;
}

/** Crop storage with a per-crop capacity. */
export class Inventory {
  private readonly amounts = emptyInventory();

  constructor(
    readonly capacity: number,
    initial: Partial<Record<CropId, number>> = {},
  ) {
    for (const id of CROP_IDS) this.amounts[id] = Math.max(0, Math.floor(initial[id] ?? 0));
  }

  get(id: CropId): number {
    return this.amounts[id];
  }

  /** Adds up to the capacity and returns how many actually fit. */
  add(id: CropId, amount: number): number {
    const accepted = Math.max(0, Math.min(amount, this.capacity - this.amounts[id]));
    this.amounts[id] += accepted;
    return accepted;
  }

  canAfford(cost: Cost): boolean {
    return costEntries(cost).every(([id, n]) => this.amounts[id] >= n);
  }

  /** First missing ingredient of a cost, if any. */
  shortfall(cost: Cost): { crop: CropId; needed: number; have: number } | null {
    for (const [id, n] of costEntries(cost)) if (this.amounts[id] < n) return { crop: id, needed: n, have: this.amounts[id] };
    return null;
  }

  spend(cost: Cost): boolean {
    if (!this.canAfford(cost)) return false;
    for (const [id, n] of costEntries(cost)) this.amounts[id] -= n;
    return true;
  }

  snapshot(): InventorySnapshot {
    return { ...this.amounts };
  }
}
