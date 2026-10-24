import { step } from '@/domain/geometry';
import { describePosition, requireDirection } from '../arguments';
import type { ApiFunction } from '../types';

export const MOVEMENT_API: readonly ApiFunction[] = [
  {
    name: 'move',
    signature: 'move(direction)',
    returns: 'boolean',
    group: 'Movement',
    isAction: true,
    minArgs: 1,
    maxArgs: 1,
    description:
      'Flies one tile "north", "south", "east" or "west". Costs 2 ticks. Returns false without moving if the way is blocked or off the field.',
    example: 'move("north");',
    invoke({ farm, notices }, [dir]) {
      const direction = requireDirection('move', dir);
      const result = farm.move(direction);
      if (result.ok) return true;
      notices.warn(
        `move("${direction}") was blocked at ${describePosition(farm)} by ${result.reason === 'edge' ? 'the edge of the field' : result.reason}.`,
      );
      return false;
    },
  },
  {
    name: 'canMove',
    signature: 'canMove(direction)',
    returns: 'boolean',
    group: 'Movement',
    isAction: false,
    minArgs: 1,
    maxArgs: 1,
    description: 'True if a step that way is possible: inside the field and not into rock or water.',
    example: 'if (canMove("east")) move("east");',
    invoke({ farm }, [dir]) {
      return farm.isPassable(step(farm.drone, requireDirection('canMove', dir)));
    },
  },
  {
    name: 'getPosX',
    signature: 'getPosX()',
    returns: 'number',
    group: 'Movement',
    isAction: false,
    minArgs: 0,
    maxArgs: 0,
    description: "The drone's column. 0 is the west edge.",
    invoke: ({ farm }) => farm.drone.x,
  },
  {
    name: 'getPosY',
    signature: 'getPosY()',
    returns: 'number',
    group: 'Movement',
    isAction: false,
    minArgs: 0,
    maxArgs: 0,
    description: "The drone's row. 0 is the south edge.",
    invoke: ({ farm }) => farm.drone.y,
  },
];
