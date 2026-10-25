import { CROPS, costEntries } from '@/domain/crops';
import { sandboxLoadout } from '@/progression';
import { useT } from '@/i18n/context';
import type { MessageKey } from '@/i18n/en';
import { briefingText, missionText, translateKey } from '@/i18n/messages';
import { formatCount } from '../../format';
import { useGame } from '../../GameContext';
import { CostChips, CropIcon } from '../CropIcon';

const METRIC_KEYS = {
  ticks: 'mission.metric.ticks',
  actions: 'mission.metric.actions',
  instructions: 'mission.metric.instructions',
} as const satisfies Record<string, MessageKey>;

export function MissionTab({ onShowReference }: { onShowReference: () => void }) {
  const { t, locale } = useT();
  const game = useGame();
  const { level, save, missionStatus, lastRun } = game;

  if (level.kind === 'sandbox') {
    const l = sandboxLoadout(save);
    return (
      <>
        <h2>{t('mission.openFarm')}</h2>
        <p className="concept">{t('mission.sandboxTag')}</p>
        <p>{t('mission.sandboxBody')}</p>
        <p>{t('mission.sandboxSpend')}</p>
        <h3>{t('mission.yourDrone')}</h3>
        <dl className="stats-list">
          <dt>{t('mission.field')}</dt>
          <dd>{t('mission.fieldSize', { size: l.size })}</dd>
          <dt>{t('mission.cargo')}</dt>
          <dd>{t('mission.cargoEach', { capacity: l.capacity })}</dd>
          <dt>{t('mission.moveCost')}</dt>
          <dd>{t('mission.ticks', { count: l.moveCost })}</dd>
          <dt>{t('mission.harvestBonus')}</dt>
          <dd>{l.yieldBonus ? t('mission.harvestBonusValue', { bonus: l.yieldBonus }) : t('mission.none')}</dd>
        </dl>
        <h3>{t('mission.seeds')}</h3>
        <div className="chip-row">
          {save.unlockedCrops.map((c) => (
            <span key={c} className="chip">
              <CropIcon crop={c} />
              {CROPS[c].label}
            </span>
          ))}
        </div>
      </>
    );
  }

  const m = level.mission;
  const best = save.best[m.id];
  const met = missionStatus?.objectivesMet ?? m.objectives.map(() => false);
  return (
    <>
      <h2>{missionText(locale, m.id, 'title', m.title)}</h2>
      <p className="concept">{missionText(locale, m.id, 'concept', m.concept)}</p>
      {m.briefing.map((text, i) => (
        <p key={text}>{briefingText(locale, m.id, i, text)}</p>
      ))}
      <h3>{t('mission.objectives')}</h3>
      <ul className="objectives">
        {m.objectives.map((o, i) => (
          <li key={o.description} className={met[i] ? 'is-met' : ''}>
            <span className="objectives__box" aria-hidden="true" />
            <span>
              {o.key ? translateKey(locale, o.key, o.params, o.description) : o.description}
              <span className="sr-only">{met[i] ? t('mission.objectiveDone') : ''}</span>
            </span>
          </li>
        ))}
        {(m.failureRules ?? [])
          .filter((r) => r.description)
          .map((r) => (
            <li key={r.description} className="is-rule">
              <span className="objectives__box" aria-hidden="true" />
              <span>{r.description}</span>
            </li>
          ))}
      </ul>
      {m.introduces.length > 0 && (
        <>
          <h3>{t('mission.newThisMission')}</h3>
          <div className="chip-row">
            {m.introduces.map((f) => (
              <button key={f} className="fnchip" onClick={onShowReference} title={t('mission.showInReference')}>
                {f}()
              </button>
            ))}
          </div>
        </>
      )}
      {m.crops.length > 0 && (
        <>
          <h3>{t('mission.seedsAvailable')}</h3>
          <div className="chip-row">
            {m.crops.map((c) => (
              <span key={c} className="chip">
                <CropIcon crop={c} />
                {CROPS[c].label}
                {costEntries(CROPS[c].cost).length > 0 && (
                  <span className="chip__note">
                    {t('mission.costs')}{' '}
                    {costEntries(CROPS[c].cost)
                      .map(([k, n]) => `${n} ${k}`)
                      .join(', ')}
                  </span>
                )}
              </span>
            ))}
          </div>
        </>
      )}
      <h3>{save.completed[m.id] ? t('mission.rewardCollected') : t('mission.reward')}</h3>
      <div className="chip-row">
        <CostChips cost={m.reward} />
      </div>
      <h3>{t('mission.efficiency')}</h3>
      <table className="record">
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">{t('mission.measure')}</span>
            </th>
            <th scope="col">{t('mission.lastRun')}</th>
            <th scope="col">{t('mission.best')}</th>
          </tr>
        </thead>
        <tbody>
          {(['ticks', 'actions', 'instructions'] as const).map((k) => (
            <tr key={k}>
              <th scope="row">{t(METRIC_KEYS[k])}</th>
              <td>{lastRun ? formatCount(lastRun[k]) : '–'}</td>
              <td>{best ? formatCount(best[k]) : '–'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
