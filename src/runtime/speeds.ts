import type { SpeedLevel } from '@/persistence';

export interface SpeedOption {
  readonly level: SpeedLevel;
  readonly label: string;
  /** Screen time per drone action. */
  readonly actionMs: number;
}

export const SPEEDS: readonly SpeedOption[] = [
  { level: 1, label: 'Slow', actionMs: 520 },
  { level: 2, label: 'Relaxed', actionMs: 260 },
  { level: 3, label: 'Normal', actionMs: 130 },
  { level: 4, label: 'Fast', actionMs: 55 },
  { level: 5, label: 'Very fast', actionMs: 18 },
  { level: 6, label: 'Instant', actionMs: 0 },
];

export function speedOption(level: SpeedLevel): SpeedOption {
  return SPEEDS.find((s) => s.level === level) ?? (SPEEDS[2] as SpeedOption);
}
