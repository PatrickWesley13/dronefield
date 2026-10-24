import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import type { GameController, GameSnapshot } from '@/app/gameController';
import type { LogEntry } from '@/app/consoleLog';

const GameContext = createContext<GameController | null>(null);

export function GameProvider({ controller, children }: { controller: GameController; children: ReactNode }) {
  return <GameContext.Provider value={controller}>{children}</GameContext.Provider>;
}

export function useController(): GameController {
  const c = useContext(GameContext);
  if (!c) throw new Error('useController must be used inside <GameProvider>');
  return c;
}

export function useGame(): GameSnapshot {
  const c = useController();
  return useSyncExternalStore(c.subscribe, c.getSnapshot);
}

export function useConsoleEntries(): readonly LogEntry[] {
  const { log } = useController();
  return useSyncExternalStore(
    (cb) => log.changes.subscribe(cb),
    () => log.entries,
  );
}
