import type { ExecutionLimits } from '@/interpreter';

export const MISSION_LIMITS: ExecutionLimits = { maxInstructions: 1_000_000, idleLimit: 50_000 };
export const SANDBOX_LIMITS: ExecutionLimits = { maxInstructions: 20_000_000, idleLimit: 50_000 };
