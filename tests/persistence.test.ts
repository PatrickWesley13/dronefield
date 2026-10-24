import { describe, expect, it } from 'vitest';
import { DRONE_API } from '@/api';
import { MISSIONS } from '@/missions';
import { WebStorageSaveRepository, createDefaultSave, migrateSave, type MigrationContext } from '@/persistence';
import { UPGRADES } from '@/progression';

const ctx: MigrationContext = {
  knownLevels: new Set(MISSIONS.map((m) => m.id)),
  knownFunctions: new Set(DRONE_API.map((f) => f.name)),
  knownUpgrades: new Set(UPGRADES.map((u) => u.id)),
};

class MemoryStorage {
  readonly items = new Map<string, string>();
  getItem(k: string): string | null {
    return this.items.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.items.set(k, v);
  }
}

describe('persistence', () => {
  it('round-trips a save', () => {
    const storage = new MemoryStorage();
    const repo = new WebStorageSaveRepository(storage, ctx);
    const save = {
      ...createDefaultSave(),
      completed: { m1: true as const },
      code: { m1: 'move("east");' },
      bank: { ...createDefaultSave().bank, wheat: 7 },
    };
    expect(repo.save(save)).toBe(true);
    expect(repo.load()).toEqual({ save, notice: null });
  });
  it('migrates a v1 save', () => {
    const v1 = {
      version: 1,
      completed: { m1: true },
      unlockedFns: ['move', 'print', 'harvest'],
      unlockedCrops: ['wheat'],
      bank: { wheat: 3 },
      current: 'm2',
      code: { m2: 'print(1)' },
      settings: { speed: 5, motion: 'off', coords: false },
      lifetime: { runs: 2, harvested: 4 },
      farm: { w: 5, h: 5, tick: 9, drone: { x: 1, y: 1 }, tiles: [['soil', 'wheat', 3, 0]] },
    };
    const s = migrateSave(v1, ctx)!;
    expect(s.version).toBe(3);
    expect(s.unlockedFunctions).toEqual(['move', 'harvest']);
    expect(s.currentLevel).toBe('m2');
    expect(s.settings).toMatchObject({ speed: 5, motion: 'reduced', showCoordinates: false, language: null });
    expect(s.lifetime.harvests).toBe(4);
    expect(s.farm?.tiles[0]).toEqual(['soil', 'wheat', 3, 0]);
    expect(s.code.m2).toBe('print(1)');
  });
  it('keeps a valid language and drops an unknown one', () => {
    expect(migrateSave({ version: 3, settings: { language: 'pt-BR' } }, ctx)!.settings.language).toBe('pt-BR');
    expect(migrateSave({ version: 3, settings: { language: 'klingon' } }, ctx)!.settings.language).toBeNull();
  });
  it('rejects unknown versions and junk', () => {
    expect(migrateSave(null, ctx)).toBeNull();
    expect(migrateSave({ version: 99 }, ctx)).toBeNull();
    expect(migrateSave([1, 2], ctx)).toBeNull();
  });
  it('sanitizes hostile values', () => {
    const s = migrateSave(
      {
        version: 2,
        bank: { wheat: -5, carrot: 'x' },
        unlockedFunctions: ['eval', 'harvest'],
        completed: { m99: true },
        settings: { speed: 77 },
        currentLevel: 'nope',
      },
      ctx,
    )!;
    expect(s.bank.wheat).toBe(0);
    expect(s.unlockedFunctions).toEqual(['move', 'harvest']);
    expect(s.completed).toEqual({});
    expect(s.settings.speed).toBe(3);
    expect(s.currentLevel).toBe('m1');
  });
  it('backs up unreadable data and starts fresh', () => {
    const storage = new MemoryStorage();
    storage.setItem('dronefield.save', '{not json');
    const result = new WebStorageSaveRepository(storage, ctx).load();
    expect(result.save).toEqual(createDefaultSave());
    expect(result.notice).toMatch(/backup/);
    expect(storage.getItem('dronefield.save.backup')).toBe('{not json');
  });
});
