export type SoundName = 'move' | 'plant' | 'harvest' | 'water' | 'bump' | 'error' | 'win' | 'buy';

export interface SoundPlayer {
  play(name: SoundName): void;
}

export const silentSoundPlayer: SoundPlayer = { play: () => {} };
