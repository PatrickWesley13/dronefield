export const MAX_COLLECTION_SIZE = 100_000;
export const MAX_CALL_DEPTH = 200;

export interface ExecutionLimits {
  /** Hard cap on interpreter steps for one run. */
  readonly maxInstructions: number;
  /** Steps allowed in a row without the game clock moving: catches loops that never act. */
  readonly idleLimit: number;
}
