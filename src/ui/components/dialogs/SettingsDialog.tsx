import { useEffect, useRef } from 'react';
import { MISSIONS } from '@/missions';
import type { MotionPreference, ThemePreference } from '@/persistence';
import { useT } from '@/i18n/context';
import { LOCALES, LOCALE_NAMES, type Locale } from '@/i18n/locales';
import { formatCount } from '../../format';
import { useController, useGame } from '../../GameContext';
import { useConfirm } from './ConfirmProvider';

export function SettingsDialog({ open, onClose, onReplayTour }: { open: boolean; onClose: () => void; onReplayTour: () => void }) {
  const game = useGame();
  const controller = useController();
  const confirm = useConfirm();
  const { t } = useT();
  const dialog = useRef<HTMLDialogElement>(null);
  const { settings, lifetime, completed } = game.save;

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const wipe = async () => {
    onClose();
    const ok = await confirm({
      title: t('settings.resetTitle'),
      body: t('settings.resetBody'),
      confirmLabel: t('settings.resetConfirm'),
    });
    if (ok) controller.resetProgress();
  };

  return (
    <dialog ref={dialog} onClose={onClose} aria-labelledby="settings-title">
      <h2 id="settings-title">{t('settings.title')}</h2>
      <label className="field">
        {t('settings.language')}
        <select
          value={settings.language ?? ''}
          onChange={(e) => controller.updateSettings({ language: e.target.value === '' ? null : (e.target.value as Locale) })}
        >
          <option value="">{t('settings.languageAuto')}</option>
          {LOCALES.map((locale) => (
            <option key={locale} value={locale}>
              {LOCALE_NAMES[locale]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        {t('settings.sound')}
        <input type="checkbox" checked={settings.sound} onChange={(e) => controller.updateSettings({ sound: e.target.checked })} />
      </label>
      <label className="field">
        {t('settings.animations')}
        <select value={settings.motion} onChange={(e) => controller.updateSettings({ motion: e.target.value as MotionPreference })}>
          <option value="auto">{t('settings.animations.auto')}</option>
          <option value="full">{t('settings.animations.full')}</option>
          <option value="reduced">{t('settings.animations.reduced')}</option>
        </select>
      </label>
      <label className="field">
        {t('settings.coords')}
        <input
          type="checkbox"
          checked={settings.showCoordinates}
          onChange={(e) => controller.updateSettings({ showCoordinates: e.target.checked })}
        />
      </label>
      <label className="field">
        {t('settings.theme')}
        <select value={settings.theme} onChange={(e) => controller.updateSettings({ theme: e.target.value as ThemePreference })}>
          <option value="system">{t('settings.theme.system')}</option>
          <option value="light">{t('settings.theme.light')}</option>
          <option value="dark">{t('settings.theme.dark')}</option>
        </select>
      </label>
      <h3>{t('settings.lifetime')}</h3>
      <dl className="stats-list">
        <dt>{t('settings.runs')}</dt>
        <dd>{formatCount(lifetime.runs)}</dd>
        <dt>{t('settings.harvests')}</dt>
        <dd>{formatCount(lifetime.harvests)}</dd>
        <dt>{t('settings.actionsCount')}</dt>
        <dd>{formatCount(lifetime.actions)}</dd>
        <dt>{t('settings.instructionsCount')}</dt>
        <dd>{formatCount(lifetime.instructions)}</dd>
        <dt>{t('settings.missions')}</dt>
        <dd>{t('settings.missionsDone', { done: Object.keys(completed).length, total: MISSIONS.length })}</dd>
      </dl>
      <div className="dialog__actions dialog__actions--split">
        <button className="btn btn--danger" onClick={wipe}>
          {t('settings.reset')}
        </button>
        <span>
          <button
            className="btn"
            onClick={() => {
              onClose();
              onReplayTour();
            }}
          >
            {t('settings.replayTour')}
          </button>{' '}
          <button className="btn btn--primary" onClick={onClose}>
            {t('app.done')}
          </button>
        </span>
      </div>
    </dialog>
  );
}
