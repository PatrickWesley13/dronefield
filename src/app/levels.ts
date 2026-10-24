import { findMission, type Mission } from '@/missions';
import { SANDBOX_ID } from '@/persistence';

export type Level =
  | { readonly kind: 'mission'; readonly id: string; readonly mission: Mission }
  | { readonly kind: 'sandbox'; readonly id: typeof SANDBOX_ID };

export const SANDBOX_LEVEL: Level = { kind: 'sandbox', id: SANDBOX_ID };

export function resolveLevel(id: string): Level | null {
  if (id === SANDBOX_ID) return SANDBOX_LEVEL;
  const mission = findMission(id);
  return mission ? { kind: 'mission', id, mission } : null;
}

export const SANDBOX_STARTER = [
  '// Your own farm. Harvests here are yours to keep',
  '// and spend on upgrades.',
  'const { width, height } = getWorldSize();',
  '',
  'function tend() {',
  '  if (getCropGrowth() === 1) harvest();',
  '  if (getCropType() === null) plant("wheat");',
  '}',
  '',
  'for (let y = 0; y < height; y++) {',
  '  for (let x = 0; x < width - 1; x++) {',
  '    tend();',
  '    move(y % 2 === 0 ? "east" : "west");',
  '  }',
  '  tend();',
  '  if (y < height - 1) move("north");',
  '}',
  '',
].join('\n');

export function starterCode(level: Level): string {
  return level.kind === 'sandbox' ? SANDBOX_STARTER : level.mission.starterCode;
}

export function fileName(level: Level): string {
  return level.kind === 'sandbox' ? 'open-farm.js' : `${level.mission.title.toLowerCase().replace(/[^a-z]+/g, '-')}.js`;
}
