import { useSyncExternalStore } from 'react';
import type { MotionPreference } from '@/persistence';

const query = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
const subscribe = (cb: () => void) => {
  query?.addEventListener('change', cb);
  return () => query?.removeEventListener('change', cb);
};

export function prefersReducedMotion(preference: MotionPreference): boolean {
  return preference === 'reduced' || (preference === 'auto' && !!query?.matches);
}

export function useReducedMotion(preference: MotionPreference): boolean {
  const system = useSyncExternalStore(
    subscribe,
    () => !!query?.matches,
    () => false,
  );
  return preference === 'reduced' || (preference === 'auto' && system);
}
