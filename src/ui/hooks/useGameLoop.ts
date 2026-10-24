import { useEffect } from 'react';
import type { GameController } from '@/app/gameController';

/** Drives program playback once per animation frame. */
export function useGameLoop(controller: GameController): void {
  useEffect(() => {
    let id = 0;
    const tick = () => {
      controller.frame();
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    const flush = () => controller.flush();
    window.addEventListener('pagehide', flush);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('pagehide', flush);
    };
  }, [controller]);
}
