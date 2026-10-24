import { FARMING_API } from './functions/farming';
import { INSPECTION_API } from './functions/inspection';
import { MOVEMENT_API } from './functions/movement';
import { RESOURCES_API } from './functions/resources';
import type { ApiFunction } from './types';

/** Every drone function, in documentation order. New functions are added by listing them here. */
export const DRONE_API: readonly ApiFunction[] = [...MOVEMENT_API, ...INSPECTION_API, ...FARMING_API, ...RESOURCES_API];

const BY_NAME = new Map(DRONE_API.map((f) => [f.name, f]));

export function findApiFunction(name: string): ApiFunction | undefined {
  return BY_NAME.get(name);
}

export function isApiFunctionName(name: string): boolean {
  return BY_NAME.has(name);
}
