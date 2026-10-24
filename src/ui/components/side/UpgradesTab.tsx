import { UPGRADES, canAfford, findUpgrade, isSandboxUnlocked } from '@/progression';
import { useController, useGame } from '../../GameContext';
import { CostChips } from '../CropIcon';

export function UpgradesTab() {
  const { save, level, hud, playback } = useGame();
  const controller = useController();
  const bank = level.kind === 'sandbox' ? hud.inventory : save.bank;
  return (
    <>
      <div className="note">Upgrades apply to your Open farm. Missions always use a standard drone, so their scores stay comparable.</div>
      {!isSandboxUnlocked(save) && (
        <p>
          Finish <b>Planting Season</b> to open your farm and start earning crops for upgrades.
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
              {owned ? <span className="chip">Owned</span> : <CostChips cost={u.cost} have={bank} />}
              {!owned && (
                <button
                  className={`btn${affordable && requirementMet ? ' btn--primary' : ''}`}
                  disabled={!affordable || !requirementMet || !!playback}
                  onClick={() => controller.buyUpgrade(u.id)}
                >
                  {requirementMet ? 'Buy' : `Needs ${findUpgrade(u.requires!)?.name}`}
                </button>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}
