import { UPGRADES, canAfford, findUpgrade, isSandboxUnlocked } from '@/progression';
import { MISSIONS } from '@/missions';
import { translateKey } from '@/i18n/messages';
import { useT } from '@/i18n/context';
import { useController, useGame } from '../../GameContext';
import { CostChips } from '../CropIcon';

export function UpgradesTab() {
  const { save, level, hud, playback } = useGame();
  const controller = useController();
  const { t, locale } = useT();
  const bank = level.kind === 'sandbox' ? hud.inventory : save.bank;
  const nameOf = (id: string, fallback: string) => translateKey(locale, `upgrade.${id}.name`, {}, fallback);
  const unlockMission = MISSIONS.find((m) => m.unlocksFarm);
  const unlockMissionTitle = unlockMission ? translateKey(locale, `mission.${unlockMission.id}.title`, {}, unlockMission.title) : '';
  return (
    <>
      <div className="note">{t('upgrades.note')}</div>
      {!isSandboxUnlocked(save) && <p>{t('upgrades.finishFirst', { mission: unlockMissionTitle })}</p>}
      {UPGRADES.map((u) => {
        const owned = !!save.upgrades[u.id];
        const requirementMet = !u.requires || !!save.upgrades[u.requires];
        const affordable = canAfford(bank, u.cost);
        const name = nameOf(u.id, u.name);
        return (
          <section key={u.id} className={`upgrade${owned ? ' upgrade--owned' : ''}`} aria-labelledby={`upg-${u.id}`}>
            <h4 id={`upg-${u.id}`}>{name}</h4>
            <p>{translateKey(locale, `upgrade.${u.id}.description`, {}, u.description)}</p>
            <div className="upgrade__row">
              {owned ? <span className="chip">{t('upgrades.owned')}</span> : <CostChips cost={u.cost} have={bank} />}
              {!owned && (
                <button
                  className={`btn${affordable && requirementMet ? ' btn--primary' : ''}`}
                  disabled={!affordable || !requirementMet || !!playback}
                  onClick={() => controller.buyUpgrade(u.id)}
                >
                  {requirementMet
                    ? t('upgrades.buy')
                    : t('upgrades.needs', { name: nameOf(u.requires!, findUpgrade(u.requires!)?.name ?? '') })}
                </button>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}
