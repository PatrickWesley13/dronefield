import { useEffect, useRef } from 'react';
import { MISSIONS } from '@/missions';
import type { MotionPreference, ThemePreference } from '@/persistence';
import { formatCount } from '../../format';
import { useController, useGame } from '../../GameContext';
import { useConfirm } from './ConfirmProvider';

export function SettingsDialog({ open, onClose, onReplayTour }: { open: boolean; onClose: () => void; onReplayTour: () => void }) {
  const game = useGame();
  const controller = useController();
  const confirm = useConfirm();
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
      title: 'Reset all progress?',
      body: 'Missions, code, crops, upgrades and your farm will be erased from this browser. Settings are kept. This can’t be undone.',
      confirmLabel: 'Erase everything',
    });
    if (ok) controller.resetProgress();
  };

  return (
    <dialog ref={dialog} onClose={onClose} aria-labelledby="settings-title">
      <h2 id="settings-title">Settings</h2>
      <label className="field">
        Sound effects
        <input type="checkbox" checked={settings.sound} onChange={(e) => controller.updateSettings({ sound: e.target.checked })} />
      </label>
      <label className="field">
        Animations
        <select value={settings.motion} onChange={(e) => controller.updateSettings({ motion: e.target.value as MotionPreference })}>
          <option value="auto">Follow system</option>
          <option value="full">Full</option>
          <option value="reduced">Reduced</option>
        </select>
      </label>
      <label className="field">
        Show grid coordinates
        <input
          type="checkbox"
          checked={settings.showCoordinates}
          onChange={(e) => controller.updateSettings({ showCoordinates: e.target.checked })}
        />
      </label>
      <label className="field">
        Theme
        <select value={settings.theme} onChange={(e) => controller.updateSettings({ theme: e.target.value as ThemePreference })}>
          <option value="system">Follow system</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <h3>Lifetime</h3>
      <dl className="stats-list">
        <dt>Runs</dt>
        <dd>{formatCount(lifetime.runs)}</dd>
        <dt>Crops harvested</dt>
        <dd>{formatCount(lifetime.harvests)}</dd>
        <dt>Drone actions</dt>
        <dd>{formatCount(lifetime.actions)}</dd>
        <dt>Instructions</dt>
        <dd>{formatCount(lifetime.instructions)}</dd>
        <dt>Missions</dt>
        <dd>
          {Object.keys(completed).length} of {MISSIONS.length}
        </dd>
      </dl>
      <div className="dialog__actions dialog__actions--split">
        <button className="btn btn--danger" onClick={wipe}>
          Reset all progress
        </button>
        <span>
          <button
            className="btn"
            onClick={() => {
              onClose();
              onReplayTour();
            }}
          >
            Replay tour
          </button>{' '}
          <button className="btn btn--primary" onClick={onClose}>
            Done
          </button>
        </span>
      </div>
    </dialog>
  );
}
