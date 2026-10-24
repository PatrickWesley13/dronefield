import { CROPS, isCropId } from './crops';
import type { CropPlacement, Farm, GroundType } from './farm';
import type { Point } from './geometry';

/** Compact, JSON-safe record of a farm's field (not its inventory or upgrades). */
export interface FarmSnapshot {
  readonly width: number;
  readonly height: number;
  readonly tick: number;
  readonly drone: Point;
  /** [ground, crop?, growth?, watered?] per tile, row-major from y = 0. */
  readonly tiles: ReadonlyArray<readonly [GroundType, string?, number?, (0 | 1)?]>;
}

export function snapshotFarm(farm: Farm): FarmSnapshot {
  return {
    width: farm.width,
    height: farm.height,
    tick: farm.tick,
    drone: { ...farm.drone },
    tiles: farm
      .allTiles()
      .map((t) => (t.crop ? ([t.ground, t.crop.type, t.crop.growth, t.crop.watered ? 1 : 0] as const) : ([t.ground] as const))),
  };
}

/** Crops and drone position that still fit in a field of the given size. */
export function restoreField(snapshot: FarmSnapshot | null, size: number): { crops: CropPlacement[]; drone: Point; tick: number } {
  if (!snapshot) return { crops: [], drone: { x: 0, y: 0 }, tick: 0 };
  const crops: CropPlacement[] = [];
  snapshot.tiles.forEach((t, i) => {
    const type = t[1];
    if (!isCropId(type)) return;
    const x = i % snapshot.width;
    const y = Math.floor(i / snapshot.width);
    if (x >= size || y >= size) return;
    const growth = Math.max(0, Math.min(CROPS[type].growTime, Number(t[2]) || 0));
    crops.push({ x, y, type, growth, watered: t[3] === 1 });
  });
  const d = snapshot.drone;
  const drone = d && d.x >= 0 && d.y >= 0 && d.x < size && d.y < size ? { x: Math.floor(d.x), y: Math.floor(d.y) } : { x: 0, y: 0 };
  return { crops, drone, tick: Number.isFinite(snapshot.tick) ? snapshot.tick : 0 };
}
