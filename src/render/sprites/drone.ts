import { DIRECTION_VECTORS, type Direction } from '@/domain/geometry';
import type { Ctx, PaintOptions } from '../types';

export type DroneMood = 'idle' | 'working' | 'troubled';
const LENS: Readonly<Record<DroneMood, string>> = { idle: '#7fd0c0', working: '#ffd36a', troubled: '#f07f8c' };
const TAU = Math.PI * 2;

export function paintDrone(c: Ctx, cx: number, groundY: number, s: number, heading: Direction, mood: DroneMood, o: PaintOptions): void {
  const r = s * 0.22;
  const bob = o.reducedMotion ? 0 : Math.sin(o.time / 320) * s * 0.03;
  const cy = groundY - s * 0.58 + bob;
  c.fillStyle = 'rgba(0,0,0,.28)';
  c.beginPath();
  c.ellipse(cx, groundY - s * 0.18, r * 1.1, r * 0.32, 0, 0, TAU);
  c.fill();

  c.lineWidth = Math.max(1.5, s * 0.035);
  for (const [ax, ay] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const) {
    const rx = cx + ax * r * 1.15,
      ry = cy + ay * r * 0.95;
    c.strokeStyle = '#d7dfd5';
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(rx, ry);
    c.stroke();
    c.fillStyle = 'rgba(230,240,232,.18)';
    c.beginPath();
    c.ellipse(rx, ry, r * 0.55, r * 0.2, 0, 0, TAU);
    c.fill();
    if (!o.reducedMotion) {
      const a = (mood === 'working' ? o.time / 25 : o.time / 140) + ax;
      c.strokeStyle = 'rgba(240,248,240,.75)';
      c.beginPath();
      c.moveTo(rx - Math.cos(a) * r * 0.5, ry - Math.sin(a) * r * 0.18);
      c.lineTo(rx + Math.cos(a) * r * 0.5, ry + Math.sin(a) * r * 0.18);
      c.stroke();
    }
  }
  c.fillStyle = '#eef3ea';
  c.beginPath();
  c.arc(cx, cy, r, 0, TAU);
  c.fill();
  c.strokeStyle = '#1f3133';
  c.lineWidth = Math.max(1, s * 0.02);
  c.stroke();
  c.fillStyle = '#f0bb4a';
  c.beginPath();
  c.arc(cx, cy, r, Math.PI * 0.15, Math.PI * 0.85);
  c.closePath();
  c.fill();

  const d = DIRECTION_VECTORS[heading];
  c.fillStyle = '#1f3133';
  c.beginPath();
  c.arc(cx + d.x * r * 0.32, cy - d.y * r * 0.32 - r * 0.1, r * 0.42, 0, TAU);
  c.fill();
  c.fillStyle = LENS[mood];
  c.beginPath();
  c.arc(cx + d.x * r * 0.4, cy - d.y * r * 0.4 - r * 0.12, r * 0.22, 0, TAU);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,.8)';
  c.beginPath();
  c.arc(cx + d.x * r * 0.4 - r * 0.08, cy - d.y * r * 0.4 - r * 0.2, r * 0.07, 0, TAU);
  c.fill();
}

export function paintBeacon(c: Ctx, cx: number, cy: number, s: number, o: PaintOptions): void {
  const phase = o.reducedMotion ? 0.5 : (o.time / 1400) % 1;
  c.strokeStyle = `rgba(243,198,80,${1 - phase})`;
  c.lineWidth = Math.max(1.5, s * 0.04);
  c.beginPath();
  c.arc(cx, cy, s * (0.15 + phase * 0.3), 0, TAU);
  c.stroke();
  c.fillStyle = '#f3c650';
  c.beginPath();
  c.arc(cx, cy, s * 0.11, 0, TAU);
  c.fill();
  c.fillStyle = '#2a1e02';
  c.beginPath();
  c.arc(cx, cy, s * 0.045, 0, TAU);
  c.fill();
}
