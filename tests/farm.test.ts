import { describe, expect, it } from 'vitest';
import { Farm } from '@/domain/farm';
import { field, output, run } from './helpers';

describe('farm simulation', () => {
  it('moves with consistent coordinates and costs time', () => {
    const r = run('move("north"); move("east"); move("east"); console.log(getPosX(), getPosY());');
    expect(r.output).toEqual(['2 1']);
    expect(r.farm.tick).toBe(6);
  });
  it('keeps the drone inside the grid', () => {
    const r = run('console.log(move("west"), canMove("south"), getPosX());');
    expect(r.output.at(-1)).toBe('false false 0');
    expect(r.farm.tick).toBe(0);
  });
  it('treats rocks and water as obstacles', () => {
    const farm = new Farm({ width: 3, height: 1, ground: ({ x }) => (x === 1 ? 'rock' : 'grass') });
    expect(run('console.log(canMove("east"), move("east"), getPosX());', farm).output.at(-1)).toBe('false false 0');
  });
  it('plants, grows and harvests', () => {
    expect(
      output(
        'plant("wheat"); console.log(getCropType(), getCropGrowth()); wait(4); console.log(getCropGrowth()); wait(4); console.log(canHarvest(), harvest(), getInventory().wheat);',
      ),
    ).toEqual(['wheat 0', '0.5', 'true true 1']);
  });
  it('destroys unripe crops on harvest', () => {
    const r = run('plant("wheat"); console.log(harvest(), getCropType());');
    expect(r.output.at(-1)).toBe('false null');
    expect(r.farm.stats.destroyed).toBe(1);
  });
  it('consumes resources and reports shortages', () => {
    const short = run('console.log(plant("carrot"));', field({ inventory: { wheat: 1 } }));
    expect(short.output[0]).toMatch(/not enough wheat/);
    expect(short.output[1]).toBe('false');
    expect(output('plant("carrot"); console.log(getInventory().wheat);', field({ inventory: { wheat: 5 } }))).toEqual(['3']);
  });
  it('refuses locked crops', () => {
    const r = run('plant("carrot");', field({ unlockedCrops: ['wheat'] }));
    expect(r.outcome.kind === 'error' && r.outcome.error.message).toMatch(/aren't unlocked/);
  });
  it('enforces inventory capacity', () => {
    const r = run(
      'harvest(); console.log(getInventory().wheat);',
      field({ capacity: 2, inventory: { wheat: 2 }, crops: [{ x: 0, y: 0, type: 'wheat' }] }),
    );
    expect(r.output).toEqual(['! Inventory full: 1 wheat lost. Cargo holds 2 of each crop.', '2']);
  });
  it('doubles growth when watered; crystals need water', () => {
    expect(
      output(
        'plant("wheat"); water(); wait(3); console.log(getCropGrowth()); move("east"); plant("crystal"); wait(10); console.log(getCropGrowth()); water(); wait(10); console.log(getCropGrowth());',
        field({ inventory: { tomato: 3 } }),
      ),
    ).toEqual(['1', '0', '0.367']);
  });
  it('only plants in soil', () => {
    expect(run('console.log(plant("wheat"));', new Farm({ width: 1, height: 1, ground: 'grass' })).output[0]).toMatch(
      /seeds only grow in soil/,
    );
  });
  it('publishes events for every action', () => {
    const farm = field();
    const seen: string[] = [];
    farm.events.subscribe((e) => seen.push(e.type));
    run('move("east"); move("west"); move("west"); plant("wheat"); harvest(); wait(2);', farm);
    expect(seen).toEqual(['moved', 'moved', 'bumped', 'planted', 'destroyed', 'waited']);
  });
});
