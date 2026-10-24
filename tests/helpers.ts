import { DRONE_API } from '@/api';
import { CROP_IDS } from '@/domain/crops';
import { Farm, type FarmConfig } from '@/domain/farm';
import { runHeadless, type HeadlessOptions, type HeadlessResult } from '@/runtime';

export const ALL_FUNCTIONS = DRONE_API.map((f) => f.name);

export function field(config: Partial<FarmConfig> = {}): Farm {
  return new Farm({ width: 5, height: 5, ground: 'soil', unlockedCrops: CROP_IDS, ...config });
}

export function run(source: string, farm: Farm = field(), options: Partial<HeadlessOptions> = {}): HeadlessResult {
  return runHeadless(source, farm, { unlockedFunctions: ALL_FUNCTIONS, ...options });
}

/** Runs a program that must succeed and returns its console output. */
export function output(source: string, farm?: Farm): readonly string[] {
  const r = run(source, farm);
  if (r.outcome.kind === 'error') throw r.outcome.error;
  return r.output;
}

export function errorOf(source: string, farm?: Farm, options?: Partial<HeadlessOptions>): { message: string; line: number | null } {
  const r = run(source, farm, options);
  if (r.outcome.kind !== 'error') throw new Error(`expected an error, got ${r.outcome.kind}`);
  const e = r.outcome.error as Error & { line?: number | null };
  return { message: e.message, line: e.line ?? null };
}
