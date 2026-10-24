import { CROPS, type CropId } from '@/domain/crops';
import type { Crop } from '@/domain/farm';
import type { Ctx, PaintOptions } from '../types';

interface CropShape {
  readonly cx: number;
  readonly base: number;
  readonly s: number;
  /** 0.35 → 1 as the crop grows. */
  readonly k: number;
  readonly ripe: boolean;
  readonly progress: number;
}

type CropPainter = (c: Ctx, shape: CropShape, crop: Crop, o: PaintOptions) => void;
const TAU = Math.PI * 2;

/** One painter per crop. Adding a crop means adding a painter here. */
export const CROP_PAINTERS: Readonly<Record<CropId, CropPainter>> = {
  wheat(c, { cx, base, s, k, ripe, progress }) {
    for (let i = -1; i <= 1; i++) {
      const bx = cx + i * s * 0.15,
        h = s * 0.55 * k,
        tx = bx + i * s * 0.05;
      c.strokeStyle = ripe ? '#c79a35' : '#79b25a';
      c.lineWidth = Math.max(1.2, s * 0.04);
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(bx, base);
      c.quadraticCurveTo(bx, base - h * 0.6, tx, base - h);
      c.stroke();
      if (progress > 0.45) {
        c.fillStyle = ripe ? '#f3c650' : '#a7cc6c';
        c.beginPath();
        c.ellipse(tx, base - h - s * 0.06, s * 0.055, s * 0.12 * k, i * 0.2, 0, TAU);
        c.fill();
      }
    }
  },
  carrot(c, { cx, base, s, k, ripe }) {
    if (ripe) {
      c.fillStyle = '#ef8a3a';
      c.beginPath();
      c.ellipse(cx, base - s * 0.03, s * 0.14, s * 0.09, 0, 0, TAU);
      c.fill();
    }
    c.fillStyle = '#5fae55';
    for (const a of [-0.55, 0, 0.55]) {
      c.save();
      c.translate(cx, base - s * 0.06);
      c.rotate(a);
      c.beginPath();
      c.ellipse(0, -s * 0.2 * k, s * 0.07 * k, s * 0.22 * k, 0, 0, TAU);
      c.fill();
      c.restore();
    }
  },
  tomato(c, { cx, base, s, k, ripe, progress }) {
    c.fillStyle = '#4c9246';
    for (const [dx, dy, r] of [
      [-0.13, -0.12, 0.17],
      [0.13, -0.14, 0.16],
      [0, -0.28, 0.17],
      [0, -0.06, 0.15],
    ] as const) {
      c.beginPath();
      c.arc(cx + dx * s * k, base + dy * s * k * 1.4, r * s * k, 0, TAU);
      c.fill();
    }
    if (progress > 0.5) {
      c.fillStyle = ripe ? '#e5473e' : '#a6c95e';
      for (const [dx, dy] of [
        [-0.15, -0.2],
        [0.14, -0.26],
        [0.02, -0.42],
        [0.07, -0.1],
      ] as const) {
        c.beginPath();
        c.arc(cx + dx * s * k, base + dy * s * k, s * 0.065, 0, TAU);
        c.fill();
      }
    }
  },
  crystal(c, { cx, base, s, k, ripe }, crop, o) {
    const h = s * 0.6 * k,
      w = s * 0.2 * k;
    if (ripe && !o.reducedMotion) {
      c.shadowColor = '#b48cf2';
      c.shadowBlur = s * 0.3 * (0.7 + 0.3 * Math.sin(o.time / 400));
    }
    c.fillStyle = crop.watered ? '#a983f0' : '#7d6aa0';
    c.beginPath();
    c.moveTo(cx, base - h);
    c.lineTo(cx + w, base - h * 0.45);
    c.lineTo(cx + w * 0.6, base);
    c.lineTo(cx - w * 0.6, base);
    c.lineTo(cx - w, base - h * 0.45);
    c.closePath();
    c.fill();
    c.shadowBlur = 0;
    c.fillStyle = 'rgba(255,255,255,.35)';
    c.beginPath();
    c.moveTo(cx, base - h);
    c.lineTo(cx - w, base - h * 0.45);
    c.lineTo(cx - w * 0.2, base - h * 0.4);
    c.closePath();
    c.fill();
  },
};

export function paintCrop(c: Ctx, cx: number, cy: number, s: number, crop: Crop, o: PaintOptions): void {
  const progress = crop.growth / CROPS[crop.type].growTime;
  if (progress === 0) {
    c.fillStyle = '#2e1f14';
    for (const [dx, dy] of [
      [-0.08, 0.04],
      [0.07, -0.03],
      [0.01, 0.1],
    ] as const) {
      c.beginPath();
      c.arc(cx + dx * s, cy + dy * s, s * 0.035, 0, TAU);
      c.fill();
    }
    return;
  }
  const ripe = progress >= 1;
  CROP_PAINTERS[crop.type](c, { cx, base: cy + s * 0.3, s, k: 0.35 + 0.65 * Math.min(1, progress), ripe, progress }, crop, o);
  if (ripe) {
    const pulse = o.reducedMotion ? 1 : 0.75 + 0.25 * Math.sin(o.time / 260 + cx);
    c.fillStyle = `rgba(255,240,180,${0.85 * pulse})`;
    c.beginPath();
    c.arc(cx + s * 0.32, cy - s * 0.32, s * 0.045 * (1 + pulse * 0.4), 0, TAU);
    c.fill();
  }
}
