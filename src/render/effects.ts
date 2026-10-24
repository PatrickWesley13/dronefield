import type { Ctx } from './types';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}
interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

const MAX_PARTICLES = 260;
const MAX_LABELS = 30;

/** Short-lived visual feedback in field coordinates (tiles, y up). */
export class Effects {
  private particles: Particle[] = [];
  private labels: FloatingText[] = [];

  burst(tx: number, ty: number, color: string, count: number, spread = 2.4): void {
    if (this.particles.length > MAX_PARTICLES) return;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: tx + 0.5,
        y: ty + 0.5,
        vx: (Math.random() - 0.5) * spread,
        vy: Math.random() * 2.2 + 0.6,
        life: 1,
        color,
        size: Math.random() * 0.06 + 0.04,
      });
    }
  }

  label(tx: number, ty: number, text: string, color: string): void {
    if (this.labels.length >= MAX_LABELS) this.labels.shift();
    this.labels.push({ x: tx + 0.5, y: ty + 0.9, text, color, life: 1 });
  }

  clear(): void {
    this.particles = [];
    this.labels = [];
  }

  paint(c: Ctx, toScreen: (x: number, y: number) => [number, number], tileSize: number, font: string, reducedMotion: boolean): void {
    for (const p of this.particles) {
      p.life -= 0.025;
      p.x += p.vx * 0.012;
      p.y += p.vy * 0.012;
      p.vy -= 0.09;
      const [px, py] = toScreen(p.x, p.y);
      c.globalAlpha = Math.max(0, p.life);
      c.fillStyle = p.color;
      c.beginPath();
      c.arc(px, py, p.size * tileSize, 0, Math.PI * 2);
      c.fill();
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `800 ${Math.max(12, Math.min(16, tileSize * 0.24))}px ${font}`;
    for (const f of this.labels) {
      f.life -= reducedMotion ? 0.02 : 0.016;
      if (!reducedMotion) f.y += 0.012;
      const [px, py] = toScreen(f.x, f.y);
      c.globalAlpha = Math.max(0, Math.min(1, f.life * 1.6));
      c.fillStyle = 'rgba(0,0,0,.5)';
      c.fillText(f.text, px + 1, py + 1);
      c.fillStyle = f.color;
      c.fillText(f.text, px, py);
    }
    this.labels = this.labels.filter((f) => f.life > 0);
    c.globalAlpha = 1;
  }
}
