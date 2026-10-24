import { CROP_IDS } from '@/domain/crops';
import { MISSIONS, missionIndex } from '@/missions';
import type { RunStatus } from '@/app/gameController';
import { useController, useGame } from '../GameContext';
import { CropChip } from './CropIcon';

const STATUS_LABEL: Readonly<Record<RunStatus, string>> = {
  idle: 'Idle',
  running: 'Running',
  paused: 'Paused',
  finished: 'Finished',
  complete: 'Complete',
  failed: 'Failed',
  error: 'Error',
  stopped: 'Stopped',
};

export function TopBar({ onOpenSettings, onOpenTour }: { onOpenSettings: () => void; onOpenTour: () => void }) {
  const game = useGame();
  const controller = useController();
  const { level, save, hud } = game;
  const bank = level.kind === 'sandbox' ? hud.inventory : save.bank;
  const crops = CROP_IDS.filter((id) => save.unlockedCrops.includes(id) || bank[id] > 0);

  return (
    <header className="topbar">
      <div className="brand">
        <svg width="38" height="38" viewBox="0 0 38 38" aria-hidden="true">
          <rect width="38" height="38" rx="11" fill="#223a3b" />
          <path d="M6 29h26M9 25h20" stroke="#8b5e3c" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="19" cy="15" r="6.2" fill="#eef3ea" />
          <circle cx="20.4" cy="15" r="2.6" fill="#f0bb4a" />
          <path d="M8 9h7M23 9h7" stroke="#eef3ea" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <div>
          <h1>Dronefield</h1>
          <small>Automated Harvest</small>
        </div>
      </div>
      <div className="topbar__level">
        {level.kind === 'sandbox' ? (
          <>
            Open farm <span>sandbox</span>
          </>
        ) : (
          <>
            {level.mission.title}{' '}
            <span>
              mission {missionIndex(level.id) + 1} of {MISSIONS.length}
            </span>
          </>
        )}
      </div>
      <div className="topbar__bank" aria-label="Your stored crops">
        {crops.map((id) => (
          <CropChip key={id} crop={id} amount={bank[id]} />
        ))}
      </div>
      <div className="status" data-status={game.status} role="status" aria-live="polite">
        <i aria-hidden="true" />
        <span>{STATUS_LABEL[game.status]}</span>
      </div>
      <div className="topbar__tools">
        <button className="iconbtn" onClick={onOpenTour} aria-label="Replay the tour" title="Replay the tour">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6" />
            <circle cx="12" cy="17.2" r=".6" fill="currentColor" />
          </svg>
        </button>
        <button
          className="iconbtn"
          onClick={() => controller.updateSettings({ sound: !save.settings.sound })}
          aria-label={save.settings.sound ? 'Mute sound' : 'Turn sound on'}
          aria-pressed={!save.settings.sound}
          title={save.settings.sound ? 'Sound on' : 'Sound off'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
            {save.settings.sound ? <path d="M16 9a4.5 4.5 0 0 1 0 6M18.6 6.5a8 8 0 0 1 0 11" /> : <path d="M16.5 9.5l5 5M21.5 9.5l-5 5" />}
          </svg>
        </button>
        <button className="iconbtn" onClick={onOpenSettings} aria-label="Settings" title="Settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
            <circle cx="16" cy="7" r="2.2" />
            <circle cx="10" cy="17" r="2.2" />
          </svg>
        </button>
      </div>
    </header>
  );
}
