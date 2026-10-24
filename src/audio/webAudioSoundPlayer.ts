import type { SoundName, SoundPlayer } from './soundPlayer';

type Tone = { freq: number; dur: number; type?: OscillatorType; vol?: number; slideTo?: number; delay?: number };

/** Original synthesized effects; no audio files needed. */
const SOUNDS: Readonly<Record<SoundName, readonly Tone[]>> = {
  move: [{ freq: 360, dur: 0.09, type: 'triangle', vol: 0.025, slideTo: 470 }],
  plant: [{ freq: 180, dur: 0.12, vol: 0.07, slideTo: 120 }],
  harvest: [
    { freq: 660, dur: 0.09, type: 'triangle', vol: 0.05 },
    { freq: 990, dur: 0.14, type: 'triangle', vol: 0.04, delay: 0.06 },
  ],
  water: [{ freq: 900, dur: 0.12, vol: 0.03, slideTo: 500 }],
  bump: [{ freq: 110, dur: 0.12, type: 'square', vol: 0.03, slideTo: 80 }],
  error: [{ freq: 220, dur: 0.18, type: 'sawtooth', vol: 0.035, slideTo: 150 }],
  win: [523, 659, 784, 1047].map((freq, i) => ({ freq, dur: 0.22, type: 'triangle' as const, vol: 0.05, delay: i * 0.09 })),
  buy: [
    { freq: 520, dur: 0.08, type: 'triangle', vol: 0.05 },
    { freq: 780, dur: 0.12, type: 'triangle', vol: 0.05, delay: 0.07 },
  ],
};

export class WebAudioSoundPlayer implements SoundPlayer {
  private context: AudioContext | null = null;
  private readonly lastPlayed = new Map<SoundName, number>();

  constructor(private readonly isEnabled: () => boolean) {}

  play(name: SoundName): void {
    if (!this.isEnabled()) return;
    const now = performance.now();
    if (now - (this.lastPlayed.get(name) ?? -Infinity) < 45) return;
    this.lastPlayed.set(name, now);
    const ctx = this.ensureContext();
    if (!ctx) return;
    for (const tone of SOUNDS[name]) this.playTone(ctx, tone);
  }

  private ensureContext(): AudioContext | null {
    if (!this.context) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.context = new Ctor();
    }
    if (this.context.state === 'suspended') void this.context.resume();
    return this.context;
  }

  private playTone(ctx: AudioContext, t: Tone): void {
    const start = ctx.currentTime + (t.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = t.type ?? 'sine';
    osc.frequency.setValueAtTime(t.freq, start);
    if (t.slideTo) osc.frequency.exponentialRampToValueAtTime(t.slideTo, start + t.dur);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(t.vol ?? 0.06, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + t.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + t.dur + 0.02);
  }
}
