import type { GroundType } from '@/domain/farm';
import { tileNoise, type Ctx, type PaintOptions } from '../types';

export interface GroundTile {
  readonly ground: GroundType;
  readonly watered: boolean;
  readonly x: number;
  readonly y: number;
}

function soil(c: Ctx, px: number, py: number, s: number, t: GroundTile): void {
  const v = tileNoise(t.x, t.y);
  c.fillStyle = t.watered ? (v > 0.5 ? '#4e3a2c' : '#4a3729') : v > 0.5 ? '#77543a' : '#715036';
  c.fillRect(px, py, s, s);
  c.strokeStyle = t.watered ? 'rgba(120,170,200,.25)' : 'rgba(40,24,14,.35)';
  c.lineWidth = Math.max(1, s * 0.03);
  for (let i = 1; i < 4; i++) {
    c.beginPath();
    c.moveTo(px + s * 0.12, py + (s * i) / 4);
    c.lineTo(px + s * 0.88, py + (s * i) / 4);
    c.stroke();
  }
}

function grass(c: Ctx, px: number, py: number, s: number, t: GroundTile): void {
  c.fillStyle = tileNoise(t.x, t.y) > 0.5 ? '#5b8a4b' : '#56844a';
  c.fillRect(px, py, s, s);
  c.strokeStyle = 'rgba(160,210,120,.45)';
  c.lineWidth = Math.max(1, s * 0.025);
  for (let i = 0; i < 3; i++) {
    const gx = px + s * (0.2 + tileNoise(t.x, t.y, i) * 0.6);
    const gy = py + s * (0.25 + tileNoise(t.y, t.x, i + 4) * 0.55);
    c.beginPath();
    c.moveTo(gx, gy);
    c.lineTo(gx - s * 0.03, gy - s * 0.08);
    c.moveTo(gx, gy);
    c.lineTo(gx + s * 0.04, gy - s * 0.07);
    c.stroke();
  }
}

function rock(c: Ctx, px: number, py: number, s: number, t: GroundTile): void {
  grass(c, px, py, s, t);
  const cx = px + s / 2,
    cy = py + s * 0.56;
  c.fillStyle = 'rgba(0,0,0,.25)';
  c.beginPath();
  c.ellipse(cx, cy + s * 0.22, s * 0.36, s * 0.1, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#8d948f';
  c.beginPath();
  c.moveTo(cx - s * 0.36, cy + s * 0.2);
  c.lineTo(cx - s * 0.28, cy - s * 0.14);
  c.lineTo(cx - s * 0.02, cy - s * 0.3);
  c.lineTo(cx + s * 0.26, cy - s * 0.18);
  c.lineTo(cx + s * 0.36, cy + s * 0.2);
  c.closePath();
  c.fill();
  c.fillStyle = '#b0b6b1';
  c.beginPath();
  c.moveTo(cx - s * 0.28, cy - s * 0.14);
  c.lineTo(cx - s * 0.02, cy - s * 0.3);
  c.lineTo(cx + s * 0.04, cy - s * 0.02);
  c.lineTo(cx - s * 0.2, cy + s * 0.04);
  c.closePath();
  c.fill();
}

function water(c: Ctx, px: number, py: number, s: number, t: GroundTile, o: PaintOptions): void {
  c.fillStyle = '#3a7896';
  c.fillRect(px, py, s, s);
  c.strokeStyle = 'rgba(200,235,250,.35)';
  c.lineWidth = Math.max(1, s * 0.03);
  const phase = o.reducedMotion ? 0 : o.time / 900;
  for (let i = 0; i < 2; i++) {
    const yy = py + s * (0.35 + i * 0.3);
    c.beginPath();
    c.moveTo(px + s * 0.15, yy);
    c.quadraticCurveTo(px + s * 0.5, yy + Math.sin(phase + i + t.x) * s * 0.06, px + s * 0.85, yy);
    c.stroke();
  }
}

type GroundPainter = (c: Ctx, px: number, py: number, s: number, t: GroundTile, o: PaintOptions) => void;
export const GROUND_PAINTERS: Readonly<Record<GroundType, GroundPainter>> = { soil, grass, rock, water };
