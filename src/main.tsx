import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DRONE_API } from '@/api';
import { GameController } from '@/app/gameController';
import { WebAudioSoundPlayer } from '@/audio/webAudioSoundPlayer';
import { MISSIONS } from '@/missions';
import { DebouncedSaveRepository, WebStorageSaveRepository } from '@/persistence';
import { UPGRADES } from '@/progression';
import { App } from '@/ui/App';
import { GameProvider } from '@/ui/GameContext';
import '@/ui/styles/tokens.css';
import '@/ui/styles/app.css';

/* Composition root: the only place that knows about concrete implementations. */
function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const repository = new DebouncedSaveRepository(
  new WebStorageSaveRepository(safeLocalStorage(), {
    knownLevels: new Set(MISSIONS.map((m) => m.id)),
    knownFunctions: new Set(DRONE_API.map((f) => f.name)),
    knownUpgrades: new Set(UPGRADES.map((u) => u.id)),
  }),
);
let controller: GameController | null = null;
const sound = new WebAudioSoundPlayer(() => controller?.getSnapshot().save.settings.sound ?? false);
controller = new GameController({ repository, sound });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider controller={controller}>
      <App />
    </GameProvider>
  </StrictMode>,
);
