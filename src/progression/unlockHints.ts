import { MISSIONS } from '@/missions';
import { UPGRADES } from './upgrades';

/** How a player unlocks each drone function, derived from the missions and upgrades. */
export function unlockHint(functionName: string): string {
  const mission = MISSIONS.find((m) => m.introduces.includes(functionName));
  if (mission) return `It unlocks in mission "${mission.title}".`;
  const upgrade = UPGRADES.find((u) => u.unlocksFunction === functionName);
  if (upgrade) return `Buy the ${upgrade.name} upgrade to unlock it.`;
  return 'Keep playing to unlock it.';
}
