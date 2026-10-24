import { CROP_IDS } from '@/domain/crops';
import { useT } from '@/i18n/context';
import { formatCount } from '../../format';
import { useController, useGame } from '../../GameContext';
import { CostChips, CropChip } from '../CropIcon';
import { FarmCanvas } from './FarmCanvas';

export function Stage() {
  const game = useGame();
  const { t } = useT();
  const { hud, level } = game;
  const tickLimit = level.kind === 'mission' ? level.mission.tickLimit : undefined;
  const crops = CROP_IDS.filter((id) => hud.unlockedCrops.includes(id) || hud.inventory[id] > 0);
  return (
    <section className="stage" aria-label={t('stage.label')}>
      <FarmCanvas />
      <div className="stage__hud" aria-label={t('stage.cargo')}>
        {crops.map((id) => (
          <CropChip key={id} crop={id} amount={hud.inventory[id]} />
        ))}
        {level.kind === 'mission' && hud.capacity < 50 && <span className="chip">{t('stage.cargoEach', { capacity: hud.capacity })}</span>}
      </div>
      <div className="stage__runbar">
        <span>
          {t('stage.tick')} <b>{formatCount(hud.tick)}</b>
          {tickLimit ? ` / ${formatCount(tickLimit)}` : ''}
        </span>
        <span>
          {t('stage.drone')} <b>{t('stage.position', { x: hud.drone.x, y: hud.drone.y })}</b>
        </span>
        {hud.actions !== null && (
          <span>
            {t('stage.actions')} <b>{formatCount(hud.actions)}</b>
          </span>
        )}
        {hud.instructions !== null && (
          <span>
            {t('stage.instructions')} <b>{formatCount(hud.instructions)}</b>
          </span>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {game.playback ? '' : t('stage.droneStatus', { x: hud.drone.x, y: hud.drone.y, tick: hud.tick })}
      </p>
      <ResultBanner />
    </section>
  );
}

function ResultBanner() {
  const { report } = useGame();
  const controller = useController();
  const { t } = useT();
  if (!report) return null;
  const next = report.nextLevelId;
  return (
    <div className={`banner banner--${report.tone}`} role="dialog" aria-labelledby="banner-title">
      <h3 id="banner-title">{report.title}</h3>
      {report.message && <p>{report.message}</p>}
      {report.reward && (
        <>
          <p>{t('stage.rewardAdded')}</p>
          <div className="chip-row">
            <CostChips cost={report.reward} />
          </div>
        </>
      )}
      {report.unlockedSandbox && <p>{t('stage.sandboxUnlocked')}</p>}
      <div className="banner__stats">
        <span>
          <b>{formatCount(report.stats.ticks)}</b>
          {t('stage.statTicks')}
        </span>
        <span>
          <b>{formatCount(report.stats.actions)}</b>
          {t('stage.statActions')}
        </span>
        <span>
          <b>{formatCount(report.stats.instructions)}</b>
          {t('stage.statInstructions')}
        </span>
      </div>
      <div className="banner__actions">
        {report.tone === 'success' && next && (
          <button className="btn btn--primary" onClick={() => controller.selectLevel(next)}>
            {next === 'farm' ? t('stage.goSandbox') : t('stage.nextMission')}
          </button>
        )}
        <button className="btn" onClick={() => controller.dismissReport()}>
          {report.tone === 'success' ? t('stage.keepOptimizing') : t('stage.backToCode')}
        </button>
      </div>
    </div>
  );
}
