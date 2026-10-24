import type { SpeedLevel } from '@/persistence';
import { SPEEDS, speedOption } from '@/runtime';
import { useController, useGame } from '../../GameContext';
import { useConfirm } from '../dialogs/ConfirmProvider';

export function useResetField(): () => Promise<void> {
  const controller = useController();
  const { level, playback } = useGame();
  const confirm = useConfirm();
  return async () => {
    if (playback) return;
    if (level.kind === 'sandbox') {
      const ok = await confirm({
        title: 'Clear your farm?',
        body: 'Every crop in the field is removed and the drone returns to x 0, y 0. Your stored crops and upgrades are kept.',
        confirmLabel: 'Clear field',
      });
      if (!ok) return;
    }
    controller.resetField();
  };
}

export function Toolbar() {
  const controller = useController();
  const { playback, save } = useGame();
  const resetField = useResetField();
  const running = playback === 'running';
  const paused = playback === 'paused';
  const speed = speedOption(save.settings.speed);
  return (
    <div className="toolbar">
      <button
        className="btn btn--primary"
        onClick={() => controller.toggleRun()}
        title={`${running ? 'Pause' : paused ? 'Resume' : 'Run'} (Ctrl+Enter)`}
      >
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          {running ? (
            <>
              <rect x="4" y="3" width="3" height="10" rx="1" />
              <rect x="9" y="3" width="3" height="10" rx="1" />
            </>
          ) : (
            <path d="M4 2.5v11l9-5.5z" />
          )}
        </svg>
        {running ? 'Pause' : paused ? 'Resume' : 'Run'}
      </button>
      <button className="btn" onClick={() => controller.stepLine()} title="Run one line (F10)">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M3 4h7M3 8h4M9 8l3 3-3 3" />
        </svg>
        Step
      </button>
      <button className="btn" onClick={() => controller.stop()} disabled={!playback} title="Stop (Ctrl+Shift+Enter)">
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <rect x="3.5" y="3.5" width="9" height="9" rx="1.5" />
        </svg>
        Stop
      </button>
      <span className="toolbar__sep" aria-hidden="true" />
      <button className="btn" onClick={() => void resetField()} disabled={!!playback} title="Reset the field (Alt+R)">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M3 8a5 5 0 1 0 1.6-3.7M3 2.5v2.8h2.8" />
        </svg>
        Reset field
      </button>
      <label className="speed" id="speed-control">
        Speed
        <input
          type="range"
          min={1}
          max={SPEEDS.length}
          step={1}
          value={save.settings.speed}
          onChange={(e) => controller.updateSettings({ speed: Number(e.target.value) as SpeedLevel })}
          aria-valuetext={speed.label}
        />
        <output>{speed.label}</output>
      </label>
    </div>
  );
}
