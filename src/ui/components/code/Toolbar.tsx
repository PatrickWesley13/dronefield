import type { SpeedLevel } from '@/persistence';
import { SPEEDS, speedOption } from '@/runtime';
import { useT } from '@/i18n/context';
import type { MessageKey } from '@/i18n/en';
import { useController, useGame } from '../../GameContext';
import { useConfirm } from '../dialogs/ConfirmProvider';

const SPEED_KEYS: Readonly<Record<SpeedLevel, MessageKey>> = {
  1: 'speed.slow',
  2: 'speed.relaxed',
  3: 'speed.normal',
  4: 'speed.fast',
  5: 'speed.veryFast',
  6: 'speed.instant',
};

export function useResetField(): () => Promise<void> {
  const controller = useController();
  const { level, playback } = useGame();
  const confirm = useConfirm();
  const { t } = useT();
  return async () => {
    if (playback) return;
    if (level.kind === 'sandbox') {
      const ok = await confirm({
        title: t('dialog.clearTitle'),
        body: t('dialog.clearBody'),
        confirmLabel: t('dialog.clearConfirm'),
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
  const { t } = useT();
  const running = playback === 'running';
  const paused = playback === 'paused';
  const speed = speedOption(save.settings.speed);
  const speedLabel = t(SPEED_KEYS[speed.level]);
  const runAction = t(running ? 'toolbar.pause' : paused ? 'toolbar.resume' : 'toolbar.run');
  return (
    <div className="toolbar">
      <button className="btn btn--primary" onClick={() => controller.toggleRun()} title={t('toolbar.runTitle', { action: runAction })}>
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
        {runAction}
      </button>
      <button className="btn" onClick={() => controller.stepLine()} title={t('toolbar.stepTitle')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M3 4h7M3 8h4M9 8l3 3-3 3" />
        </svg>
        {t('toolbar.step')}
      </button>
      <button className="btn" onClick={() => controller.stop()} disabled={!playback} title={t('toolbar.stopTitle')}>
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <rect x="3.5" y="3.5" width="9" height="9" rx="1.5" />
        </svg>
        {t('toolbar.stop')}
      </button>
      <span className="toolbar__sep" aria-hidden="true" />
      <button className="btn" onClick={() => void resetField()} disabled={!!playback} title={t('toolbar.resetTitle')}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M3 8a5 5 0 1 0 1.6-3.7M3 2.5v2.8h2.8" />
        </svg>
        {t('toolbar.resetField')}
      </button>
      <label className="speed" id="speed-control">
        {t('toolbar.speed')}
        <input
          type="range"
          min={1}
          max={SPEEDS.length}
          step={1}
          value={save.settings.speed}
          onChange={(e) => controller.updateSettings({ speed: Number(e.target.value) as SpeedLevel })}
          aria-valuetext={speedLabel}
        />
        <output>{speedLabel}</output>
      </label>
    </div>
  );
}
