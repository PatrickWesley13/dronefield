import { CROPS, costEntries } from '@/domain/crops';
import { sandboxLoadout } from '@/progression';
import { formatCount } from '../../format';
import { useGame } from '../../GameContext';
import { CostChips, CropIcon } from '../CropIcon';

export function MissionTab({ onShowReference }: { onShowReference: () => void }) {
  const game = useGame();
  const { level, save, missionStatus, lastRun } = game;

  if (level.kind === 'sandbox') {
    const l = sandboxLoadout(save);
    return (
      <>
        <h2>Open farm</h2>
        <p className="concept">Sandbox</p>
        <p>
          Your own field, with every function and seed you’ve unlocked. Crops you harvest here go straight into your stores, and the field
          stays as you left it between visits.
        </p>
        <p>Spend crops on upgrades to farm faster. A program that loops forever is fine here: press Stop whenever you like.</p>
        <h3>Your drone</h3>
        <dl className="stats-list">
          <dt>Field</dt>
          <dd>
            {l.size} × {l.size} tiles
          </dd>
          <dt>Cargo</dt>
          <dd>{l.capacity} of each crop</dd>
          <dt>Move cost</dt>
          <dd>
            {l.moveCost} tick{l.moveCost > 1 ? 's' : ''}
          </dd>
          <dt>Harvest bonus</dt>
          <dd>{l.yieldBonus ? `+${l.yieldBonus} per harvest` : 'none'}</dd>
        </dl>
        <h3>Seeds</h3>
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
      <h2>{m.title}</h2>
      <p className="concept">{m.concept}</p>
      {m.briefing.map((t) => (
        <p key={t}>{t}</p>
      ))}
      <h3>Objectives</h3>
      <ul className="objectives">
        {m.objectives.map((o, i) => (
          <li key={o.description} className={met[i] ? 'is-met' : ''}>
            <span className="objectives__box" aria-hidden="true" />
            <span>
              {o.description}
              <span className="sr-only">{met[i] ? ' (done)' : ''}</span>
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
          <h3>New this mission</h3>
          <div className="chip-row">
            {m.introduces.map((f) => (
              <button key={f} className="fnchip" onClick={onShowReference} title="Show in Reference">
                {f}()
              </button>
            ))}
          </div>
        </>
      )}
      {m.crops.length > 0 && (
        <>
          <h3>Seeds available</h3>
          <div className="chip-row">
            {m.crops.map((c) => (
              <span key={c} className="chip">
                <CropIcon crop={c} />
                {CROPS[c].label}
                {costEntries(CROPS[c].cost).length > 0 && (
                  <span className="chip__note">
                    costs{' '}
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
      <h3>{save.completed[m.id] ? 'Reward (collected)' : 'Reward'}</h3>
      <div className="chip-row">
        <CostChips cost={m.reward} />
      </div>
      <h3>Efficiency</h3>
      <table className="record">
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Measure</span>
            </th>
            <th scope="col">Last run</th>
            <th scope="col">Best</th>
          </tr>
        </thead>
        <tbody>
          {(['ticks', 'actions', 'instructions'] as const).map((k) => (
            <tr key={k}>
              <th scope="row">{k[0]!.toUpperCase() + k.slice(1)}</th>
              <td>{lastRun ? formatCount(lastRun[k]) : '–'}</td>
              <td>{best ? formatCount(best[k]) : '–'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
