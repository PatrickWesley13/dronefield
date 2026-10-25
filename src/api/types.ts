import type { Farm } from '@/domain/farm';
import type { Value } from '@/interpreter';
import type { Message } from '@/shared/message';

/** Game-side messages that aren't the player's own console output. */
export interface GameNotices {
  warn(text: string | Message): void;
}

export interface ApiContext {
  readonly farm: Farm;
  readonly notices: GameNotices;
}

export type ApiGroup = 'Movement' | 'Inspection' | 'Farming' | 'Resources';

/** One function the drone exposes to player code, with the docs shown in the game. */
export interface ApiFunction {
  readonly name: string;
  readonly signature: string;
  readonly returns: string;
  readonly group: ApiGroup;
  readonly description: string;
  readonly example?: string;
  /** Takes game time. The runner animates and re-checks objectives after each action. */
  readonly isAction: boolean;
  readonly minArgs: number;
  readonly maxArgs: number;
  invoke(ctx: ApiContext, args: readonly Value[]): Value;
}
