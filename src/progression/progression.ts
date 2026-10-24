import { CROP_IDS, costEntries, type CropId } from '@/domain/crops';
import { Farm } from '@/domain/farm';
import { restoreField, snapshotFarm } from '@/domain/farmSnapshot';
import { MISSIONS, missionIndex, type Mission } from '@/missions';
import type { BestRun, SaveData } from '@/persistence';
import { BASE_LOADOUT, UPGRADES, findUpgrade, type FarmLoadout } from './upgrades';

/* Pure state transitions over SaveData. Nothing here touches the DOM or storage. */

export function isMissionUnlocked(save: SaveData, missionId: string): boolean {
  const i = missionIndex(missionId);
  if (i < 0) return false;
  const previous = MISSIONS[i - 1];
  return !previous || !!save.completed[previous.id];
}

export function isSandboxUnlocked(save: SaveData): boolean {
  return MISSIONS.some((m) => m.unlocksFarm && save.completed[m.id]);
}

/** Everything taught up to and including this mission becomes available. */
export function enterMission(save: SaveData, mission: Mission): SaveData {
  const upTo = MISSIONS.slice(0, missionIndex(mission.id) + 1);
  const fns = new Set(save.unlockedFunctions);
  const crops = new Set(save.unlockedCrops);
  for (const m of upTo) {
    m.introduces.forEach((f) => fns.add(f));
    m.crops.forEach((c) => crops.add(c));
  }
  return { ...save, currentLevel: mission.id, unlockedFunctions: [...fns], unlockedCrops: [...crops] };
}

export interface CompletionResult {
  readonly save: SaveData;
  readonly firstTime: boolean;
  readonly newBest: boolean;
  readonly previousBest: BestRun | null;
}

export function recordCompletion(save: SaveData, mission: Mission, run: BestRun): CompletionResult {
  const firstTime = !save.completed[mission.id];
  const bank = { ...save.bank };
  if (firstTime) for (const [id, n] of costEntries(mission.reward)) bank[id] += n;
  const previousBest = save.best[mission.id] ?? null;
  const newBest =
    !previousBest || run.ticks < previousBest.ticks || (run.ticks === previousBest.ticks && run.actions < previousBest.actions);
  return {
    save: {
      ...save,
      bank,
      completed: { ...save.completed, [mission.id]: true },
      best: newBest ? { ...save.best, [mission.id]: run } : save.best,
    },
    firstTime,
    newBest,
    previousBest,
  };
}

export type PurchaseResult = { readonly ok: true; readonly save: SaveData } | { readonly ok: false; readonly reason: string };

export function purchaseUpgrade(save: SaveData, upgradeId: string): PurchaseResult {
  const u = findUpgrade(upgradeId);
  if (!u) return { ok: false, reason: 'Unknown upgrade.' };
  if (save.upgrades[u.id]) return { ok: false, reason: 'Already owned.' };
  if (u.requires && !save.upgrades[u.requires]) return { ok: false, reason: 'Requires an earlier upgrade.' };
  if (!canAfford(save.bank, u.cost)) return { ok: false, reason: 'Not enough crops.' };
  const bank = { ...save.bank };
  for (const [id, n] of costEntries(u.cost)) bank[id] -= n;
  return {
    ok: true,
    save: {
      ...save,
      bank,
      upgrades: { ...save.upgrades, [u.id]: true },
      unlockedFunctions:
        u.unlocksFunction && !save.unlockedFunctions.includes(u.unlocksFunction)
          ? [...save.unlockedFunctions, u.unlocksFunction]
          : save.unlockedFunctions,
      unlockedCrops:
        u.unlocksCrop && !save.unlockedCrops.includes(u.unlocksCrop) ? [...save.unlockedCrops, u.unlocksCrop] : save.unlockedCrops,
    },
  };
}

export function canAfford(bank: Readonly<Record<CropId, number>>, cost: Partial<Record<CropId, number>>): boolean {
  return costEntries(cost).every(([id, n]) => bank[id] >= n);
}

export function sandboxLoadout(save: SaveData): FarmLoadout {
  return UPGRADES.filter((u) => save.upgrades[u.id] && u.modifyLoadout).reduce((l, u) => u.modifyLoadout!(l), BASE_LOADOUT);
}

/** The persistent sandbox farm: the saved field, the player's bank as inventory, and upgrades applied. */
export function createSandboxFarm(save: SaveData): Farm {
  const loadout = sandboxLoadout(save);
  const field = restoreField(save.farm, loadout.size);
  return new Farm({
    width: loadout.size,
    height: loadout.size,
    ground: 'soil',
    crops: field.crops,
    drone: field.drone,
    tick: field.tick,
    inventory: save.bank,
    capacity: loadout.capacity,
    unlockedCrops: save.unlockedCrops,
    moveCost: loadout.moveCost,
    yieldBonus: loadout.yieldBonus,
  });
}

/** Writes the sandbox farm's field and inventory back into the save. */
export function storeSandboxFarm(save: SaveData, farm: Farm): SaveData {
  const inv = farm.inventory.snapshot();
  return { ...save, farm: snapshotFarm(farm), bank: Object.fromEntries(CROP_IDS.map((id) => [id, inv[id]])) as Record<CropId, number> };
}

export function clearSandboxField(save: SaveData): SaveData {
  return { ...save, farm: null };
}

export interface RunTotals {
  readonly harvests: number;
  readonly actions: number;
  readonly instructions: number;
}

export function recordRun(save: SaveData, run: RunTotals): SaveData {
  const lt = save.lifetime;
  return {
    ...save,
    lifetime: {
      runs: lt.runs + 1,
      harvests: lt.harvests + run.harvests,
      actions: lt.actions + run.actions,
      instructions: lt.instructions + run.instructions,
    },
  };
}
