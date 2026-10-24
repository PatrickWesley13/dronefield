import { describe, expect, it } from 'vitest';
import { findMission, MISSIONS } from '@/missions';
import { createDefaultSave, type SaveData } from '@/persistence';
import {
  createSandboxFarm,
  enterMission,
  isMissionUnlocked,
  isSandboxUnlocked,
  purchaseUpgrade,
  recordCompletion,
  sandboxLoadout,
  storeSandboxFarm,
  unlockHint,
} from '@/progression';
import { ALL_FUNCTIONS, run } from './helpers';

const rich = (): SaveData => ({ ...createDefaultSave(), bank: { wheat: 200, carrot: 100, tomato: 50, crystal: 5 } });
function buy(save: SaveData, ...ids: string[]): SaveData {
  return ids.reduce((s, id) => {
    const r = purchaseUpgrade(s, id);
    if (!r.ok) throw new Error(`${id}: ${r.reason}`);
    return r.save;
  }, save);
}

describe('progression', () => {
  it('unlocks missions in order and the sandbox after Planting Season', () => {
    let s = createDefaultSave();
    expect(isMissionUnlocked(s, 'm1')).toBe(true);
    expect(isMissionUnlocked(s, 'm2')).toBe(false);
    expect(isSandboxUnlocked(s)).toBe(false);
    s = recordCompletion(s, findMission('m1')!, { ticks: 10, actions: 5, instructions: 5 }).save;
    expect(isMissionUnlocked(s, 'm2')).toBe(true);
    for (const id of ['m2', 'm3']) s = recordCompletion(s, findMission(id)!, { ticks: 1, actions: 1, instructions: 1 }).save;
    expect(isSandboxUnlocked(s)).toBe(true);
  });
  it('pays rewards once and tracks the best run', () => {
    const m1 = findMission('m1')!;
    const first = recordCompletion(createDefaultSave(), m1, { ticks: 10, actions: 5, instructions: 5 });
    expect(first).toMatchObject({ firstTime: true, newBest: true });
    expect(first.save.bank.wheat).toBe(5);
    const again = recordCompletion(first.save, m1, { ticks: 12, actions: 5, instructions: 5 });
    expect(again).toMatchObject({ firstTime: false, newBest: false });
    expect(again.save.bank.wheat).toBe(5);
    expect(again.save.best.m1?.ticks).toBe(10);
  });
  it('unlocks everything taught up to the entered mission', () => {
    const s = enterMission(createDefaultSave(), findMission('m9')!);
    for (const m of MISSIONS.slice(0, 9)) for (const f of m.introduces) expect(s.unlockedFunctions).toContain(f);
    expect(s.unlockedCrops).toEqual(expect.arrayContaining(['wheat', 'carrot', 'tomato']));
    expect(s.unlockedFunctions).not.toContain('water');
  });
  it('applies upgrades to the sandbox and its gameplay', () => {
    const s = buy(rich(), 'rotors', 'field1', 'cargo1', 'lens', 'crystal', 'blades');
    expect(sandboxLoadout(s)).toEqual({ size: 7, capacity: 150, moveCost: 1, yieldBonus: 1 });
    expect(s.unlockedFunctions).toContain('canHarvest');
    expect(s.unlockedCrops).toContain('crystal');
    const farm = createSandboxFarm(s);
    const before = farm.inventory.get('wheat');
    const r = run('move("east"); plant("wheat"); wait(8); harvest(); console.log(getTickCount());', farm, {
      unlockedFunctions: ALL_FUNCTIONS,
    });
    expect(r.output).toEqual(['11']);
    expect(farm.inventory.get('wheat')).toBe(before + 2);
  });
  it('checks upgrade requirements and costs', () => {
    expect(purchaseUpgrade(rich(), 'field2')).toEqual({ ok: false, reason: 'Requires an earlier upgrade.' });
    expect(purchaseUpgrade(createDefaultSave(), 'rotors')).toEqual({ ok: false, reason: 'Not enough crops.' });
    expect(purchaseUpgrade(buy(rich(), 'rotors'), 'rotors')).toEqual({ ok: false, reason: 'Already owned.' });
  });
  it('round-trips the sandbox field through the save', () => {
    let s = createDefaultSave();
    const farm = createSandboxFarm(s);
    farm.plant('wheat');
    farm.move('east');
    s = storeSandboxFarm(s, farm);
    const again = createSandboxFarm(s);
    expect(again.tileAt({ x: 0, y: 0 })?.crop?.type).toBe('wheat');
    expect(again.drone).toEqual({ x: 1, y: 0 });
    expect(again.tick).toBe(3);
  });
  it('explains how to unlock each function', () => {
    expect(unlockHint('harvest')).toMatch(/First Harvest/);
    expect(unlockHint('scan')).toMatch(/Sensor array/);
  });
});
