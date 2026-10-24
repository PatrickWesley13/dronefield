import type { CropId } from '@/domain/crops';
import type { CropPlacement, FarmConfig, GroundType } from '@/domain/farm';
import type { Point } from '@/domain/geometry';
import type { MissionMap } from './types';

interface LegendEntry {
  readonly ground: GroundType;
  readonly crop?: CropId;
  /** Omitted = ripe. */
  readonly growth?: number;
  readonly beacon?: boolean;
}

/** Lowercase crop letters are ripe; uppercase are freshly planted. */
export const MAP_LEGEND: Readonly<Record<string, LegendEntry>> = {
  '.': { ground: 'soil' },
  ',': { ground: 'grass' },
  '#': { ground: 'rock' },
  '~': { ground: 'water' },
  B: { ground: 'grass', beacon: true },
  w: { ground: 'soil', crop: 'wheat' },
  c: { ground: 'soil', crop: 'carrot' },
  t: { ground: 'soil', crop: 'tomato' },
  W: { ground: 'soil', crop: 'wheat', growth: 0 },
  C: { ground: 'soil', crop: 'carrot', growth: 0 },
  T: { ground: 'soil', crop: 'tomato', growth: 0 },
};

export interface ParsedMap {
  readonly width: number;
  readonly height: number;
  readonly ground: (p: Point) => GroundType;
  readonly crops: readonly CropPlacement[];
  readonly beacon: Point | null;
}

export function parseMap(map: MissionMap): ParsedMap {
  const height = map.rows.length;
  const width = map.rows[0]?.length ?? 0;
  const grounds: GroundType[] = [];
  const crops: CropPlacement[] = [];
  let beacon: Point | null = null;
  map.rows.forEach((row, r) => {
    if (row.length !== width) throw new Error(`Map row ${r} has length ${row.length}, expected ${width}`);
    const y = height - 1 - r;
    [...row].forEach((ch, x) => {
      const entry = MAP_LEGEND[ch];
      if (!entry) throw new Error(`Unknown map character '${ch}'`);
      grounds[y * width + x] = entry.ground;
      if (entry.crop)
        crops.push(entry.growth === undefined ? { x, y, type: entry.crop } : { x, y, type: entry.crop, growth: entry.growth });
      if (entry.beacon) beacon = { x, y };
    });
  });
  return { width, height, ground: (p) => grounds[p.y * width + p.x] ?? 'grass', crops, beacon };
}

export function farmConfigFromMap(map: MissionMap): Pick<FarmConfig, 'width' | 'height' | 'ground' | 'crops' | 'beacon'> {
  const parsed = parseMap(map);
  return { width: parsed.width, height: parsed.height, ground: parsed.ground, crops: parsed.crops, beacon: parsed.beacon };
}
