import { useEffect, useRef } from 'react';

export interface Shortcuts {
  readonly runOrPause: () => void;
  readonly stop: () => void;
  readonly step: () => void;
  readonly resetField: () => void;
  readonly enabled: boolean;
}

/** Ctrl/Cmd+Enter run or pause, Ctrl/Cmd+Shift+Enter stop, F10 step, Alt+R reset the field. */
export function useShortcuts(shortcuts: Shortcuts): void {
  const latest = useRef(shortcuts);
  latest.current = shortcuts;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = latest.current;
      if (!s.enabled) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) s.stop();
        else s.runOrPause();
      } else if (e.key === 'F10') {
        e.preventDefault();
        s.step();
      } else if (e.altKey && e.code === 'KeyR') {
        e.preventDefault();
        s.resetField();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
