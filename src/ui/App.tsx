import { useCallback, useState } from 'react';
import { CodePanel } from './components/code/CodePanel';
import { useResetField } from './components/code/Toolbar';
import { ConfirmProvider } from './components/dialogs/ConfirmProvider';
import { SettingsDialog } from './components/dialogs/SettingsDialog';
import { SidePanel, type SideTab } from './components/side/SidePanel';
import { Stage } from './components/stage/Stage';
import { Toast } from './components/Toast';
import { TopBar } from './components/TopBar';
import { Tour } from './components/Tour';
import { useController, useGame } from './GameContext';
import { useGameLoop } from './hooks/useGameLoop';
import { useShortcuts } from './hooks/useShortcuts';
import { useTheme } from './hooks/useTheme';

export function App() {
  return (
    <ConfirmProvider>
      <Shell />
    </ConfirmProvider>
  );
}

function Shell() {
  const controller = useController();
  const game = useGame();
  const [tab, setTab] = useState<SideTab>('mission');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(!game.save.tutorialDone);
  const [insertRequest, setInsertRequest] = useState<{ text: string; nonce: number } | null>(null);
  const resetField = useResetField();

  useTheme(game.save.settings.theme);
  useGameLoop(controller);
  useShortcuts({
    enabled: !tourOpen && !settingsOpen,
    runOrPause: () => controller.toggleRun(),
    stop: () => controller.stop(),
    step: () => controller.stepLine(),
    resetField: () => void resetField(),
  });

  const closeTour = useCallback(() => {
    setTourOpen(false);
    setTab('mission');
    controller.completeTutorial();
  }, [controller]);

  return (
    <>
      <TopBar onOpenSettings={() => setSettingsOpen(true)} onOpenTour={() => setTourOpen(true)} />
      <main className="layout">
        <SidePanel tab={tab} onTabChange={setTab} onInsertCode={(text) => setInsertRequest({ text, nonce: Date.now() })} />
        <Stage />
        <CodePanel insertRequest={insertRequest} />
      </main>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} onReplayTour={() => setTourOpen(true)} />
      {tourOpen && <Tour onTab={setTab} onClose={closeTour} />}
      <Toast />
    </>
  );
}
