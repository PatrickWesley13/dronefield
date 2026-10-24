import type { Farm, FarmEvent } from '@/domain/farm';
import { DIRECTION_VECTORS, type Direction, type Point } from '@/domain/geometry';
import { Effects } from './effects';
import { paintCrop } from './sprites/crops';
import { paintBeacon, paintDrone, type DroneMood } from './sprites/drone';
import { GROUND_PAINTERS } from './sprites/ground';
import type { PaintOptions } from './types';

export interface RendererOptions {
  readonly showCoordinates: () => boolean;
  readonly reducedMotion: () => boolean;
  readonly droneMood: () => DroneMood;
  /** Screen time of one action; animations last a little less. */
  readonly actionMs: () => number;
  readonly font?: string;
}

interface Layout {
  ts: number;
  ox: number;
  oy: number;
  fw: number;
  fh: number;
}

/** Draws a Farm onto a canvas. Reads game state, never changes it. */
export class FarmRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly effects = new Effects();
  private farm: Farm | null = null;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private heading: Direction = 'east';
  private drone = { x: 0, y: 0, fromX: 0, fromY: 0, toX: 0, toY: 0, startedAt: 0, duration: 0 };
  private bump = { amount: 0, dir: { x: 0, y: 0 } as Point };

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: RendererOptions,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not supported in this browser.');
    this.ctx = ctx;
  }

  setFarm(farm: Farm): void {
    this.farm = farm;
    this.heading = farm.heading;
    const { x, y } = farm.drone;
    this.drone = { x, y, fromX: x, fromY: y, toX: x, toY: y, startedAt: 0, duration: 0 };
    this.effects.clear();
  }

  resize(cssWidth: number, cssHeight: number, devicePixelRatio: number): void {
    this.dpr = Math.min(2, devicePixelRatio || 1);
    this.width = cssWidth;
    this.height = cssHeight;
    this.canvas.width = Math.round(cssWidth * this.dpr);
    this.canvas.height = Math.round(cssHeight * this.dpr);
  }

  handleEvent(e: FarmEvent, now: number): void {
    const ms = this.options.actionMs();
    const fx = ms >= 18 && !this.options.reducedMotion();
    switch (e.type) {
      case 'moved':
        this.heading = e.direction;
        this.animateTo(e.to, now, ms * 0.9);
        break;
      case 'bumped':
        this.heading = e.direction;
        if (!this.options.reducedMotion()) this.bump = { amount: 1, dir: DIRECTION_VECTORS[e.direction] };
        break;
      case 'harvested':
        if (fx) this.effects.burst(e.at.x, e.at.y, '#f3c650', 9);
        if (e.amount) this.effects.label(e.at.x, e.at.y, `+${e.amount} ${e.crop}`, '#ffe08a');
        break;
      case 'planted':
        if (fx) this.effects.burst(e.at.x, e.at.y, '#a57a52', 6, 1.6);
        break;
      case 'destroyed':
        if (!this.options.reducedMotion()) this.effects.burst(e.at.x, e.at.y, '#f07f8c', 10);
        this.effects.label(e.at.x, e.at.y, 'destroyed', '#ffb3bc');
        break;
      case 'watered':
        if (fx) this.effects.burst(e.at.x, e.at.y, '#8fd3ea', 8, 1.2);
        break;
    }
  }

  draw(time: number): void {
    const farm = this.farm;
    if (!farm || !this.width) return;
    const c = this.ctx;
    const o: PaintOptions = { time, reducedMotion: this.options.reducedMotion() };
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.width, this.height);
    this.stepAnimations(time);
    const L = this.layout(farm);
    const tileTopLeft = (x: number, y: number): [number, number] => [L.ox + x * L.ts, L.oy + (farm.height - 1 - y) * L.ts];

    // plot frame
    c.fillStyle = 'rgba(0,0,0,.28)';
    this.roundRect(L.ox - 10, L.oy - 6, L.fw + 20, L.fh + 22, 14);
    c.fill();
    c.fillStyle = '#3c2a1e';
    this.roundRect(L.ox - 8, L.oy - 8, L.fw + 16, L.fh + 16, 12);
    c.fill();
    c.save();
    this.roundRect(L.ox, L.oy, L.fw, L.fh, 6);
    c.clip();
    for (let y = 0; y < farm.height; y++) {
      for (let x = 0; x < farm.width; x++) {
        const tile = farm.tileAt({ x, y })!;
        const [px, py] = tileTopLeft(x, y);
        GROUND_PAINTERS[tile.ground](c, px, py, L.ts, { ground: tile.ground, watered: !!tile.crop?.watered, x, y }, o);
      }
    }
    this.gridLines(L, farm);
    for (let y = 0; y < farm.height; y++) {
      for (let x = 0; x < farm.width; x++) {
        const crop = farm.tileAt({ x, y })?.crop;
        if (!crop) continue;
        const [px, py] = tileTopLeft(x, y);
        paintCrop(c, px + L.ts / 2, py + L.ts / 2, L.ts, crop, o);
      }
    }
    if (farm.beacon) {
      const [px, py] = tileTopLeft(farm.beacon.x, farm.beacon.y);
      paintBeacon(c, px + L.ts / 2, py + L.ts / 2, L.ts, o);
    }
    c.restore();

    if (this.options.showCoordinates()) this.coordinates(L, farm);

    const k = Math.sin(this.bump.amount * Math.PI) * 0.12;
    const [dx, dy] = tileTopLeft(this.drone.x + this.bump.dir.x * k, this.drone.y + this.bump.dir.y * k);
    paintDrone(c, dx + L.ts / 2, dy + L.ts, L.ts, this.heading, this.options.droneMood(), o);

    this.effects.paint(c, (x, y) => [L.ox + x * L.ts, L.oy + (farm.height - y) * L.ts], L.ts, this.font(), o.reducedMotion);
  }

  private animateTo(to: Point, now: number, duration: number): void {
    const d = this.drone;
    if (duration <= 0) {
      this.drone = { ...d, x: to.x, y: to.y, fromX: to.x, fromY: to.y, toX: to.x, toY: to.y, duration: 0 };
      return;
    }
    this.drone = { x: d.x, y: d.y, fromX: d.x, fromY: d.y, toX: to.x, toY: to.y, startedAt: now, duration };
  }

  private stepAnimations(time: number): void {
    const d = this.drone;
    if (d.duration) {
      const k = Math.min(1, (time - d.startedAt) / d.duration);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      d.x = d.fromX + (d.toX - d.fromX) * e;
      d.y = d.fromY + (d.toY - d.fromY) * e;
      if (k >= 1) d.duration = 0;
    } else if (this.farm && (d.x !== this.farm.drone.x || d.y !== this.farm.drone.y) && this.options.actionMs() === 0) {
      d.x = this.farm.drone.x;
      d.y = this.farm.drone.y;
    }
    if (this.bump.amount > 0) this.bump.amount = Math.max(0, this.bump.amount - 0.08);
  }

  private layout(farm: Farm): Layout {
    const padTop = 58,
      padBottom = 44,
      padX = 28;
    const coords = this.options.showCoordinates() ? 18 : 0;
    const ts = Math.max(
      12,
      Math.min(
        96,
        Math.floor(Math.min((this.width - padX * 2 - coords) / farm.width, (this.height - padTop - padBottom - coords) / farm.height)),
      ),
    );
    const fw = ts * farm.width,
      fh = ts * farm.height;
    return {
      ts,
      fw,
      fh,
      ox: Math.round((this.width - fw + coords) / 2),
      oy: Math.round(padTop + (this.height - padTop - padBottom - fh - coords) / 2),
    };
  }

  private gridLines(L: Layout, farm: Farm): void {
    const c = this.ctx;
    c.strokeStyle = 'rgba(10,20,15,.22)';
    c.lineWidth = 1;
    c.beginPath();
    for (let x = 1; x < farm.width; x++) {
      c.moveTo(L.ox + x * L.ts + 0.5, L.oy);
      c.lineTo(L.ox + x * L.ts + 0.5, L.oy + L.fh);
    }
    for (let y = 1; y < farm.height; y++) {
      c.moveTo(L.ox, L.oy + y * L.ts + 0.5);
      c.lineTo(L.ox + L.fw, L.oy + y * L.ts + 0.5);
    }
    c.stroke();
  }

  private coordinates(L: Layout, farm: Farm): void {
    const c = this.ctx;
    c.fillStyle = 'rgba(220,235,228,.6)';
    c.font = `600 ${Math.max(10, Math.min(13, L.ts * 0.22))}px ${this.font()}`;
    c.textAlign = 'center';
    c.textBaseline = 'top';
    for (let x = 0; x < farm.width; x++) c.fillText(String(x), L.ox + x * L.ts + L.ts / 2, L.oy + L.fh + 12);
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    for (let y = 0; y < farm.height; y++) c.fillText(String(y), L.ox - 14, L.oy + (farm.height - 1 - y) * L.ts + L.ts / 2);
  }

  private font(): string {
    return this.options.font ?? 'system-ui, sans-serif';
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
}
