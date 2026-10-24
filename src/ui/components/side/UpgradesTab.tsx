import { MISSIONS } from '@/missions';
import { UPGRADES, canAfford, findUpgrade, isSandboxUnlocked } from '@/progression';
import { useT } from '@/i18n/context';
import { useController, useGame } from '../../GameContext';
import { CostChips } from '../CropIcon';

export function UpgradesTab() {
  const { t } = useT();
  const { save, level, hud, playback } = useGame();
  const controller = useController();
  const bank = level.kind === 'sandbox' ? hud.inventory : save.bank;
  const farmMission = MISSIONS.find((m) => m.unlocksFarm)?.title ?? '';
  const finishFirst = t('upgrades.finishFirst', { mission: farmMission });
  const [before, after = ''] = farmMission ? finishFirst.split(farmMission) : [finishFirst];
  return (
    <>
      <div className="note">{t('upgrades.note')}</div>
      {!isSandboxUnlocked(save) && (
        <p>
          {before}
          {farmMission && <b>{farmMission}</b>}
          {after}
        </p>
      )}
      {UPGRADES.map((u) => {
        const owned = !!save.upgrades[u.id];
        const requirementMet = !u.requires || !!save.upgrades[u.requires];
        const affordable = canAfford(bank, u.cost);
        return (
          <section key={u.id} className={`upgrade${owned ? ' upgrade--owned' : ''}`} aria-labelledby={`upg-${u.id}`}>
            <h4 id={`upg-${u.id}`}>{u.name}</h4>
            <p>{u.description}</p>
            <div className="upgrade__row">
              {owned ? <span className="chip">{t('upgrades.owned')}</span> : <CostChips cost={u.cost} have={bank} />}
              {!owned && (
                <button
                  className={`btn${affordable && requirementMet ? ' btn--primary' : ''}`}
                  disabled={!affordable || !requirementMet || !!playback}
                  onClick={() => controller.buyUpgrade(u.id)}
                >
                  {requirementMet ? t('upgrades.buy') : t('upgrades.needs', { name: findUpgrade(u.requires!)?.name ?? '' })}
                </button>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}
