import { DRONE_API, type ApiGroup } from '@/api';
import { unlockHint } from '@/progression';
import { useT } from '@/i18n/context';
import type { MessageKey } from '@/i18n/en';
import { useGame } from '../../GameContext';

type Translate = ReturnType<typeof useT>['t'];

const GROUPS: readonly ApiGroup[] = ['Movement', 'Inspection', 'Farming', 'Resources'];

const GROUP_KEYS: Record<ApiGroup, MessageKey> = {
  Movement: 'reference.group.Movement',
  Inspection: 'reference.group.Inspection',
  Farming: 'reference.group.Farming',
  Resources: 'reference.group.Resources',
};

function builtins(t: Translate): ReadonlyArray<{ sig: string; doc: string; example?: string }> {
  return [
    {
      sig: 'console.log(...values)',
      doc: t('reference.builtin.console'),
      example: 'console.log("at", getPosX(), getPosY());',
    },
    {
      sig: 'Math.floor, ceil, round, trunc, abs, min, max, sqrt, pow, sign, random, PI',
      doc: t('reference.builtin.math'),
    },
    {
      sig: 'Object.keys(o), Object.values(o), Object.entries(o)',
      doc: t('reference.builtin.objects'),
      example: 'for (const [crop, n] of Object.entries(getInventory())) {}',
    },
    { sig: 'Array.isArray(v), Array.from(v, fn)', doc: t('reference.builtin.array') },
    { sig: 'JSON.stringify(v, null, 2), JSON.parse(text)', doc: t('reference.builtin.json') },
    { sig: 'Number(v), String(v), Boolean(v), parseInt(s), parseFloat(s)', doc: t('reference.builtin.conversions') },
  ];
}

// The cheat sheet is code, so it stays untranslated.
const CHEAT_SHEET = `// output
console.log("pos", getPosX(), getPosY());

// conditions
if (count < 3) { … } else if (x) { … } else { … }
switch (crop) { case "wheat": …; break; }

// loops
for (let i = 0; i < 5; i++) { … }
while (canMove("north")) { move("north"); }
for (const crop of getUnlockedCrops()) { … }

// functions
function tend(seed = "wheat") { return true; }
const total = (...ns) => ns.reduce((a, b) => a + b, 0);

// arrays and objects
const path = ["north", "east"];
path.push("south");
const { wheat, carrot = 0 } = getInventory();
const next = scan("east")?.crop ?? "nothing";

// text
\`Wheat: \${wheat}\``;

export function ReferenceTab({ onInsert }: { onInsert: (text: string) => void }) {
  const { save } = useGame();
  const { t } = useT();
  return (
    <>
      <h2>{t('reference.title')}</h2>
      <p>{t('reference.intro')}</p>
      <h3>{t('reference.directionsTitle')}</h3>
      <p>{t('reference.directions')}</p>
      <h3>{t('reference.timeTitle')}</h3>
      <p>{t('reference.time')}</p>
      {GROUPS.map((g) => (
        <section key={g}>
          <h3>{t(GROUP_KEYS[g])}</h3>
          {DRONE_API.filter((f) => f.group === g).map((f) => {
            const unlocked = save.unlockedFunctions.includes(f.name);
            return (
              <div key={f.name} className={`api${unlocked ? '' : ' api--locked'}`} id={`doc-${f.name}`}>
                <button
                  className="api__sig"
                  disabled={!unlocked}
                  onClick={() => onInsert(f.maxArgs ? `${f.name}()` : `${f.name}();`)}
                  title={unlocked ? t('reference.insert') : undefined}
                >
                  {f.signature}
                </button>{' '}
                <span className="api__ret">→ {f.returns}</span>
                {unlocked ? (
                  <>
                    <p>{f.description}</p>
                    {f.example && <pre>{f.example}</pre>}
                  </>
                ) : (
                  <p className="muted">
                    {t('reference.locked')} {unlockHint(f.name)}
                  </p>
                )}
              </div>
            );
          })}
        </section>
      ))}
      <h3>{t('reference.builtins')}</h3>
      {builtins(t).map((b) => (
        <div key={b.sig} className="api">
          <code className="api__sig api__sig--static">{b.sig}</code>
          <p>{b.doc}</p>
          {b.example && <pre>{b.example}</pre>}
        </div>
      ))}
      <h3>{t('reference.whatWorks')}</h3>
      <pre className="cheatsheet">{CHEAT_SHEET}</pre>
      <p>{t('reference.unavailable')}</p>
      <h3>{t('reference.limitsTitle')}</h3>
      <p>{t('reference.limits')}</p>
      <h3>{t('reference.shortcuts')}</h3>
      <dl className="keys">
        <dt>
          <kbd>Ctrl</kbd> <kbd>Enter</kbd>
        </dt>
        <dd>{t('reference.key.run')}</dd>
        <dt>
          <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>Enter</kbd>
        </dt>
        <dd>{t('reference.key.stop')}</dd>
        <dt>
          <kbd>F10</kbd>
        </dt>
        <dd>{t('reference.key.step')}</dd>
        <dt>
          <kbd>Alt</kbd> <kbd>R</kbd>
        </dt>
        <dd>{t('reference.key.reset')}</dd>
        <dt>
          <kbd>Ctrl</kbd> <kbd>Space</kbd>
        </dt>
        <dd>{t('reference.key.suggest')}</dd>
      </dl>
    </>
  );
}
