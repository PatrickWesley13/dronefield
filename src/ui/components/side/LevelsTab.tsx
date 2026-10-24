import { MISSIONS } from '@/missions';
import { SANDBOX_ID } from '@/persistence';
import { isMissionUnlocked, isSandboxUnlocked } from '@/progression';
import { formatCount } from '../../format';
import { useController, useGame } from '../../GameContext';

export function LevelsTab({ onSelected }: { onSelected: () => void }) {
  const { save, level } = useGame();
  const controller = useController();
  const select = (id: string) => {
    controller.selectLevel(id);
    onSelected();
  };
  const farmOpen = isSandboxUnlocked(save);
  return (
    <>
      <p className="muted">
        {Object.keys(save.completed).length} of {MISSIONS.length} missions complete. Your code for each level is saved separately.
      </p>
      <ul className="levels">
        <li>
          <button
            className="level level--farm"
            disabled={!farmOpen}
            aria-current={level.id === SANDBOX_ID}
            onClick={() => select(SANDBOX_ID)}
          >
            <span className="level__badge">{farmOpen ? '★' : '🔒'}</span>
            <span className="level__title">
              Open farm<small>{farmOpen ? 'Sandbox: grow crops for upgrades' : 'Unlocks after Planting Season'}</small>
            </span>
            <span />
          </button>
        </li>
        {MISSIONS.map((m, i) => {
          const open = isMissionUnlocked(save, m.id);
          const best = save.best[m.id];
          return (
            <li key={m.id}>
              <button
                className={`level${save.completed[m.id] ? ' level--done' : ''}`}
                disabled={!open}
                aria-current={level.id === m.id}
                onClick={() => select(m.id)}
              >
                <span className="level__badge">{open ? i + 1 : '🔒'}</span>
                <span className="level__title">
                  {m.title}
                  <small>{m.concept}</small>
                </span>
                <span className="level__best">{best ? `${formatCount(best.ticks)} ticks` : ''}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
