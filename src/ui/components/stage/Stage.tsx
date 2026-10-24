import { CROP_IDS } from '@/domain/crops';
import { formatCount } from '../../format';
import { useController, useGame } from '../../GameContext';
import { CostChips, CropChip } from '../CropIcon';
import { FarmCanvas } from './FarmCanvas';

export function Stage() {
  const game = useGame();
  const { hud, level } = game;
  const tickLimit = level.kind === 'mission' ? level.mission.tickLimit : undefined;
  const crops = CROP_IDS.filter((id) => hud.unlockedCrops.includes(id) || hud.inventory[id] > 0);
  return (
    <section className="stage" aria-label="Farm">
      <FarmCanvas />
      <div className="stage__hud" aria-label="Drone cargo">
        {crops.map((id) => (
          <CropChip key={id} crop={id} amount={hud.inventory[id]} />
        ))}
        {level.kind === 'mission' && hud.capacity < 50 && <span className="chip">cargo {hud.capacity} each</span>}
      </div>
      <div className="stage__runbar">
        <span>
          Tick <b>{formatCount(hud.tick)}</b>
          {tickLimit ? ` / ${formatCount(tickLimit)}` : ''}
        </span>
        <span>
          Drone{' '}
          <b>
            x {hud.drone.x}, y {hud.drone.y}
          </b>
        </span>
        {hud.actions !== null && (
          <span>
            Actions <b>{formatCount(hud.actions)}</b>
          </span>
        )}
        {hud.instructions !== null && (
          <span>
            Instructions <b>{formatCount(hud.instructions)}</b>
          </span>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {game.playback ? '' : `Drone at x ${hud.drone.x}, y ${hud.drone.y}. ${hud.tick} ticks.`}
      </p>
      <ResultBanner />
    </section>
  );
}

function ResultBanner() {
  const { report } = useGame();
  const controller = useController();
  if (!report) return null;
  const next = report.nextLevelId;
  return (
    <div className={`banner banner--${report.tone}`} role="dialog" aria-labelledby="banner-title">
      <h3 id="banner-title">{report.title}</h3>
      {report.message && <p>{report.message}</p>}
      {report.reward && (
        <>
          <p>Reward added to your stores:</p>
          <div className="chip-row">
            <CostChips cost={report.reward} />
          </div>
        </>
      )}
      {report.unlockedSandbox && <p>The Open farm is now unlocked. Grow crops there and spend them on upgrades.</p>}
      <div className="banner__stats">
        <span>
          <b>{formatCount(report.stats.ticks)}</b>ticks
        </span>
        <span>
          <b>{formatCount(report.stats.actions)}</b>actions
        </span>
        <span>
          <b>{formatCount(report.stats.instructions)}</b>instructions
        </span>
      </div>
      <div className="banner__actions">
        {report.tone === 'success' && next && (
          <button className="btn btn--primary" onClick={() => controller.selectLevel(next)}>
            {next === 'farm' ? 'Go to the Open farm' : 'Next mission'}
          </button>
        )}
        <button className="btn" onClick={() => controller.dismissReport()}>
          {report.tone === 'success' ? 'Keep optimizing' : 'Back to the code'}
        </button>
      </div>
    </div>
  );
}
