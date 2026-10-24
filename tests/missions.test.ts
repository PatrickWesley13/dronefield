import { describe, expect, it } from 'vitest';
import { MISSIONS, createMissionFarm, findMission } from '@/missions';
import { ALL_FUNCTIONS, run } from './helpers';

const SOLUTIONS: Record<string, string> = {
  m1: 'for (let i = 0; i < 5; i++) move("east");',
  m2: 'move("north"); move("north"); move("east"); move("east"); harvest();',
  m3: 'for (let i = 0; i < 3; i++) { plant("wheat"); wait(8); harvest(); }',
  m4: 'for (let i = 0; i < 8; i++) { harvest(); move("east"); }',
  m5: 'for (let i = 0; i < 8; i++) { if (getCropGrowth() === 1) harvest(); move("east"); }',
  m6: 'while (getPosX() < 6 || getPosY() < 6) { if (getPosX() < 6 && canMove("east")) move("east"); else move("north"); }',
  m7: `function tendTile() { if (getCropType() === null) plant("wheat"); else if (getCropGrowth() === 1) harvest(); }
const goWest = () => { while (getPosX() > 0) move("west"); };
while (getInventory().wheat < 16) {
  for (let y = 0; y < 4; y++) { for (let x = 0; x < 4; x++) { tendTile(); if (x < 3) move("east"); } goWest(); if (y < 3) move("north"); }
  while (getPosY() > 0) move("south");
}`,
  m8: `function sweep(fn) { for (let y = 0; y < 3; y++) { for (let x = 0; x < 3; x++) { fn(); if (x < 2) move(y % 2 ? "west" : "east"); } if (y < 2) move("north"); } move("south"); move("south"); while (getPosX() > 0) move("west"); }
while (getInventory().carrot < 6) {
  sweep(() => {
    if (getCropGrowth() === 1) harvest();
    if (getCropType() === null) plant(getInventory().wheat >= 4 ? "carrot" : "wheat");
  });
  wait(2);
}`,
  m9: `function tend() { const c = getCropType(); if (c !== null && getCropGrowth() === 1) { harvest(); plant(c); } }
for (let y = 0; y < 3; y++) { for (let x = 0; x < 5; x++) { tend(); if (x < 4) move(y % 2 ? "west" : "east"); } if (y < 2) move("north"); }`,
  m10: `const { width, height } = getWorldSize();
function pick() { const { wheat, carrot, tomato } = getInventory(); if (carrot >= 12 && tomato < 6) return "tomato"; if (wheat >= 24 && carrot < 12) return "carrot"; return "wheat"; }
function tend() { if (getCropGrowth() === 1) harvest(); if (getCropType() === null) { if (!plant(pick())) plant("wheat"); water(); } }
while (true) {
  for (let y = 0; y < height; y++) { for (let x = 0; x < width - 1; x++) { tend(); move(y % 2 === 0 ? "east" : "west"); } tend(); if (y < height - 1) move("north"); }
  for (let i = 0; i < height - 1; i++) move("south");
}`,
};

describe('missions', () => {
  it('has ten missions with unique ids', () => {
    expect(MISSIONS).toHaveLength(10);
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(10);
  });

  describe.each(MISSIONS.map((m) => [m.id, m.title, m] as const))('%s %s', (id, _title, mission) => {
    it('is completed by a correct program', () => {
      const r = run(SOLUTIONS[id] ?? '', createMissionFarm(mission), { mission, unlockedFunctions: ALL_FUNCTIONS });
      expect(r.outcome.kind, JSON.stringify(r.outcome)).toBe('completed');
    });
    it('is not completed by its starter code', () => {
      const r = run(mission.starterCode, createMissionFarm(mission), { mission, limits: { idleLimit: 2000 } });
      expect(r.outcome.kind).not.toBe('completed');
    });
  });

  it('fails a program that destroys seedlings (m5)', () => {
    const m = findMission('m5')!;
    const r = run('for (let i = 0; i < 8; i++) { harvest(); move("east"); }', createMissionFarm(m), { mission: m });
    expect(r.outcome.kind).toBe('failed');
    expect(r.outcome.kind === 'failed' && r.outcome.reason).toMatch(/seedling/);
  });
  it('stops the stuck m6 starter with a debugging message', () => {
    const m = findMission('m6')!;
    const r = run(m.starterCode, createMissionFarm(m), { mission: m, limits: { idleLimit: 2000 } });
    expect(r.outcome.kind === 'error' && r.outcome.error.message).toMatch(/without the drone doing anything/);
  });
  it('fails slow programs on the m10 tick limit', () => {
    const m = findMission('m10')!;
    const r = run('while (true) wait(100);', createMissionFarm(m), { mission: m });
    expect(r.outcome.kind === 'failed' && r.outcome.reason).toMatch(/Out of time/);
  });
  it('reports a finished-but-incomplete program as finished', () => {
    const m = findMission('m1')!;
    const r = run('move("east");', createMissionFarm(m), { mission: m });
    expect(r.outcome).toMatchObject({ kind: 'finished', status: { complete: false } });
  });
});
