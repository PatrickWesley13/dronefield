import { Farm } from '@/domain/farm';
import { step } from '@/domain/geometry';
import { createObject } from '@/interpreter';
import { requireDirection } from '../arguments';
import type { ApiFunction } from '../types';

export const INSPECTION_API: readonly ApiFunction[] = [
  {
    name: 'getWorldSize',
    signature: 'getWorldSize()',
    returns: '{ width, height }',
    group: 'Inspection',
    isAction: false,
    minArgs: 0,
    maxArgs: 0,
    description: 'The size of the field in tiles.',
    example: 'const { width, height } = getWorldSize();',
    invoke: ({ farm }) => createObject({ width: farm.width, height: farm.height }),
  },
  {
    name: 'getGroundType',
    signature: 'getGroundType()',
    returns: 'string',
    group: 'Inspection',
    isAction: false,
    minArgs: 0,
    maxArgs: 0,
    description: 'The ground below: "soil" or "grass". Only soil can be planted.',
    invoke: ({ farm }) => farm.currentTile().ground,
  },
  {
    name: 'getEntityType',
    signature: 'getEntityType()',
    returns: 'string',
    group: 'Inspection',
    isAction: false,
    minArgs: 0,
    maxArgs: 0,
    description: 'What sits on the tile below: "crop", "beacon" or "empty".',
    invoke: ({ farm }) => (farm.currentTile().crop ? 'crop' : farm.isAtBeacon() ? 'beacon' : 'empty'),
  },
  {
    name: 'getCropType',
    signature: 'getCropType()',
    returns: 'string | null',
    group: 'Inspection',
    isAction: false,
    minArgs: 0,
    maxArgs: 0,
    description: 'The crop below, like "wheat", or null if there is none.',
    invoke: ({ farm }) => farm.currentTile().crop?.type ?? null,
  },
  {
    name: 'getCropGrowth',
    signature: 'getCropGrowth()',
    returns: 'number',
    group: 'Inspection',
    isAction: false,
    minArgs: 0,
    maxArgs: 0,
    description: 'Growth of the crop below from 0 to 1. 1 means ripe. Returns 0 on an empty tile.',
    example: 'if (getCropGrowth() === 1) harvest();',
    invoke: ({ farm }) => Farm.growthFraction(farm.currentTile().crop),
  },
  {
    name: 'canHarvest',
    signature: 'canHarvest()',
    returns: 'boolean',
    group: 'Inspection',
    isAction: false,
    minArgs: 0,
    maxArgs: 0,
    description: 'True if the crop below is ripe.',
    invoke: ({ farm }) => Farm.isRipe(farm.currentTile().crop),
  },
  {
    name: 'scan',
    signature: 'scan(direction)',
    returns: 'object | null',
    group: 'Inspection',
    isAction: false,
    minArgs: 1,
    maxArgs: 1,
    description: 'Looks at the next tile without flying there. Returns { ground, crop, growth }, or null past the edge.',
    example: 'const crop = scan("east")?.crop ?? "nothing";',
    invoke({ farm }, [dir]) {
      const tile = farm.tileAt(step(farm.drone, requireDirection('scan', dir)));
      if (!tile) return null;
      return createObject({ ground: tile.ground, crop: tile.crop?.type ?? null, growth: Farm.growthFraction(tile.crop) });
    },
  },
];
