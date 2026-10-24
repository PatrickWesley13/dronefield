import { Emitter } from '@/shared/emitter';
import { CROPS, type CropId } from './crops';
import { step, type Direction, type Point } from './geometry';
import { Inventory } from './inventory';

export type GroundType = 'soil' | 'grass' | 'rock' | 'water';
const IMPASSABLE: ReadonlySet<GroundType> = new Set(['rock', 'water']);

export interface Crop {
  readonly type: CropId;
  growth: number;
  watered: boolean;
}

export interface Tile {
  readonly ground: GroundType;
  crop: Crop | null;
}

export interface CropPlacement extends Point {
  readonly type: CropId;
  readonly growth?: number;
  readonly watered?: boolean;
}

export interface FarmConfig {
  readonly width: number;
  readonly height: number;
  readonly ground?: GroundType | ((p: Point) => GroundType);
  readonly crops?: readonly CropPlacement[];
  readonly drone?: Point;
  readonly beacon?: Point | null;
  readonly inventory?: Partial<Record<CropId, number>>;
  readonly capacity?: number;
  readonly unlockedCrops?: readonly CropId[];
  readonly moveCost?: number;
  readonly yieldBonus?: number;
  readonly tick?: number;
}

export type FarmEvent =
  | { type: 'moved'; from: Point; to: Point; direction: Direction }
  | { type: 'bumped'; at: Point; direction: Direction; obstacle: GroundType | 'edge' }
  | { type: 'harvested'; at: Point; crop: CropId; amount: number; lost: number }
  | { type: 'destroyed'; at: Point; crop: CropId }
  | { type: 'planted'; at: Point; crop: CropId }
  | { type: 'watered'; at: Point }
  | { type: 'waited'; ticks: number }
  | { type: 'idle'; at: Point };

export type ActionResult<R extends string = string> = { ok: true } | { ok: false; reason: R };

export interface FarmStats {
  actions: number;
  moves: number;
  harvests: number;
  destroyed: number;
  planted: number;
  watered: number;
  failedActions: number;
}

const emptyStats = (): FarmStats => ({ actions: 0, moves: 0, harvests: 0, destroyed: 0, planted: 0, watered: 0, failedActions: 0 });

/**
 * The farm simulation: terrain, crops, the drone and time.
 * Pure game rules — no rendering, no scripting, no persistence.
 */
export class Farm {
  readonly width: number;
  readonly height: number;
  readonly inventory: Inventory;
  readonly events = new Emitter<FarmEvent>();
  readonly stats: FarmStats = emptyStats();
  readonly beacon: Point | null;
  readonly unlockedCrops: ReadonlySet<CropId>;
  readonly moveCost: number;
  readonly yieldBonus: number;
  private readonly tiles: Tile[];
  private dronePos: Point;
  private droneHeading: Direction = 'east';
  private ticks: number;

  constructor(config: FarmConfig) {
    this.width = config.width;
    this.height = config.height;
    const ground = config.ground ?? 'soil';
    this.tiles = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++)
        this.tiles.push({ ground: typeof ground === 'function' ? ground({ x, y }) : ground, crop: null });
    }
    for (const c of config.crops ?? []) {
      const tile = this.tileAt(c);
      if (tile) tile.crop = { type: c.type, growth: c.growth ?? CROPS[c.type].growTime, watered: c.watered ?? false };
    }
    this.dronePos = config.drone ?? { x: 0, y: 0 };
    this.beacon = config.beacon ?? null;
    this.inventory = new Inventory(config.capacity ?? 50, config.inventory);
    this.unlockedCrops = new Set(config.unlockedCrops ?? ['wheat']);
    this.moveCost = config.moveCost ?? 2;
    this.yieldBonus = config.yieldBonus ?? 0;
    this.ticks = config.tick ?? 0;
  }

  // ---- queries
  get tick(): number {
    return this.ticks;
  }
  get drone(): Point {
    return this.dronePos;
  }
  get heading(): Direction {
    return this.droneHeading;
  }

  inBounds(p: Point): boolean {
    return p.x >= 0 && p.y >= 0 && p.x < this.width && p.y < this.height;
  }
  tileAt(p: Point): Tile | null {
    return this.inBounds(p) ? (this.tiles[p.y * this.width + p.x] ?? null) : null;
  }
  currentTile(): Tile {
    return this.tileAt(this.dronePos) as Tile;
  }
  isPassable(p: Point): boolean {
    const t = this.tileAt(p);
    return !!t && !IMPASSABLE.has(t.ground);
  }
  isAtBeacon(): boolean {
    return !!this.beacon && this.beacon.x === this.dronePos.x && this.beacon.y === this.dronePos.y;
  }
  allTiles(): readonly Readonly<Tile>[] {
    return this.tiles;
  }

  static isRipe(crop: Crop | null): boolean {
    return !!crop && crop.growth >= CROPS[crop.type].growTime;
  }
  static growthFraction(crop: Crop | null): number {
    return crop ? Math.round((crop.growth / CROPS[crop.type].growTime) * 1000) / 1000 : 0;
  }

  // ---- time
  advance(ticks: number): void {
    if (ticks <= 0) return;
    this.ticks += ticks;
    for (const t of this.tiles) {
      if (!t.crop) continue;
      const def = CROPS[t.crop.type];
      t.crop.growth = Math.min(def.growTime, t.crop.growth + ticks * def.growthPerTick(t.crop.watered));
    }
  }

  // ---- actions
  move(direction: Direction): ActionResult<GroundType | 'edge'> {
    this.droneHeading = direction;
    const target = step(this.dronePos, direction);
    if (!this.isPassable(target)) {
      const obstacle = this.tileAt(target)?.ground ?? 'edge';
      this.stats.failedActions++;
      this.events.emit({ type: 'bumped', at: this.dronePos, direction, obstacle });
      return { ok: false, reason: obstacle };
    }
    const from = this.dronePos;
    this.dronePos = target;
    this.stats.actions++;
    this.stats.moves++;
    this.advance(this.moveCost);
    this.events.emit({ type: 'moved', from, to: target, direction });
    return { ok: true };
  }

  harvest(): ActionResult<'empty' | 'unripe'> & { crop?: CropId; amount?: number; lost?: number } {
    const at = this.dronePos;
    const tile = this.currentTile();
    const crop = tile.crop;
    if (!crop) {
      this.stats.failedActions++;
      this.events.emit({ type: 'idle', at });
      return { ok: false, reason: 'empty' };
    }
    tile.crop = null;
    this.stats.actions++;
    if (!Farm.isRipe(crop)) {
      this.stats.destroyed++;
      this.advance(1);
      this.events.emit({ type: 'destroyed', at, crop: crop.type });
      return { ok: false, reason: 'unripe', crop: crop.type };
    }
    const produced = CROPS[crop.type].yield + this.yieldBonus;
    const amount = this.inventory.add(crop.type, produced);
    this.stats.harvests++;
    this.advance(1);
    this.events.emit({ type: 'harvested', at, crop: crop.type, amount, lost: produced - amount });
    return { ok: true, crop: crop.type, amount, lost: produced - amount };
  }

  plant(type: CropId): ActionResult {
    const at = this.dronePos;
    const tile = this.currentTile();
    const reason = this.plantBlocker(tile, type);
    if (reason) {
      this.stats.failedActions++;
      this.events.emit({ type: 'idle', at });
      return { ok: false, reason };
    }
    this.inventory.spend(CROPS[type].cost);
    this.stats.actions++;
    this.stats.planted++;
    this.advance(1);
    tile.crop = { type, growth: 0, watered: false };
    this.events.emit({ type: 'planted', at, crop: type });
    return { ok: true };
  }

  water(): ActionResult {
    const at = this.dronePos;
    const crop = this.currentTile().crop;
    if (!crop) {
      this.stats.failedActions++;
      this.events.emit({ type: 'idle', at });
      return { ok: false, reason: 'there is no crop here to water' };
    }
    crop.watered = true;
    this.stats.actions++;
    this.stats.watered++;
    this.advance(1);
    this.events.emit({ type: 'watered', at });
    return { ok: true };
  }

  wait(ticks: number): void {
    this.advance(ticks);
    this.events.emit({ type: 'waited', ticks });
  }

  private plantBlocker(tile: Tile, type: CropId): string | null {
    if (tile.ground !== 'soil') return `the drone is over ${tile.ground}, and seeds only grow in soil`;
    if (tile.crop) return `this tile already has ${tile.crop.type} growing`;
    const short = this.inventory.shortfall(CROPS[type].cost);
    if (short) return `not enough ${short.crop} (needs ${short.needed}, you have ${short.have})`;
    return null;
  }
}
