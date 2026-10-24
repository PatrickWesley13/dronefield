import { DRONE_API, type ApiGroup } from '@/api';
import { unlockHint } from '@/progression';
import { useGame } from '../../GameContext';

const GROUPS: readonly ApiGroup[] = ['Movement', 'Inspection', 'Farming', 'Resources'];

const BUILTINS: ReadonlyArray<{ sig: string; doc: string; example?: string }> = [
  {
    sig: 'console.log(...values)',
    doc: 'Writes to the console. console.info, console.warn and console.error work too, and console.clear() empties it.',
    example: 'console.log("at", getPosX(), getPosY());',
  },
  {
    sig: 'Math.floor, ceil, round, trunc, abs, min, max, sqrt, pow, sign, random, PI',
    doc: 'Number helpers. Math.random() is seeded, so a run always replays the same way.',
  },
  {
    sig: 'Object.keys(o), Object.values(o), Object.entries(o)',
    doc: 'Look inside objects, like the one getInventory() returns.',
    example: 'for (const [crop, n] of Object.entries(getInventory())) {}',
  },
  { sig: 'Array.isArray(v), Array.from(v, fn)', doc: 'Array.from({ length: 4 }, (_, i) => i) makes [0, 1, 2, 3].' },
  { sig: 'JSON.stringify(v, null, 2), JSON.parse(text)', doc: 'Turn values into text and back.' },
  { sig: 'Number(v), String(v), Boolean(v), parseInt(s), parseFloat(s)', doc: 'Conversions between values.' },
];

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
  return (
    <>
      <h2>Reference</h2>
      <p>Drone scripts are JavaScript, minus the parts that could reach outside the game. Click a function to insert it.</p>
      <h3>Directions and coordinates</h3>
      <p>
        x grows to the east, y grows to the north. The south-west corner is x 0, y 0. Directions are the strings "north", "south", "east"
        and "west".
      </p>
      <h3>Time</h3>
      <p>
        Moving takes 2 ticks. plant(), harvest() and water() take 1 tick each, and wait(n) takes n. Wheat ripens in 8 ticks, carrots in 16,
        tomatoes in 30 and crystals in 60. Watering doubles growth speed. Looking around with get… and can… functions takes no time.
      </p>
      {GROUPS.map((g) => (
        <section key={g}>
          <h3>{g}</h3>
          {DRONE_API.filter((f) => f.group === g).map((f) => {
            const unlocked = save.unlockedFunctions.includes(f.name);
            return (
              <div key={f.name} className={`api${unlocked ? '' : ' api--locked'}`} id={`doc-${f.name}`}>
                <button
                  className="api__sig"
                  disabled={!unlocked}
                  onClick={() => onInsert(f.maxArgs ? `${f.name}()` : `${f.name}();`)}
                  title={unlocked ? 'Insert into your code' : undefined}
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
                  <p className="muted">Locked. {unlockHint(f.name)}</p>
                )}
              </div>
            );
          })}
        </section>
      ))}
      <h3>Built-in JavaScript</h3>
      {BUILTINS.map((b) => (
        <div key={b.sig} className="api">
          <code className="api__sig api__sig--static">{b.sig}</code>
          <p>{b.doc}</p>
          {b.example && <pre>{b.example}</pre>}
        </div>
      ))}
      <h3>What works</h3>
      <pre className="cheatsheet">{CHEAT_SHEET}</pre>
      <p>
        Not available: classes, <code>new</code>, <code>this</code>, try/catch/throw, async code, generators, imports, regular expressions
        and browser APIs like <code>window</code>, <code>fetch</code> or <code>setTimeout</code>. Mixing types in maths or comparisons (like{' '}
        <code>"a" - 1</code>) stops with an error instead of quietly producing NaN.
      </p>
      <h3>Safety limits</h3>
      <p>
        Missions stop after 1,000,000 steps, the Open farm after 20,000,000. A program that runs 50,000 steps without any action that takes
        time is stopped as a likely endless loop.
      </p>
      <h3>Shortcuts</h3>
      <dl className="keys">
        <dt>
          <kbd>Ctrl</kbd> <kbd>Enter</kbd>
        </dt>
        <dd>Run, pause or resume</dd>
        <dt>
          <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>Enter</kbd>
        </dt>
        <dd>Stop</dd>
        <dt>
          <kbd>F10</kbd>
        </dt>
        <dd>Run one line</dd>
        <dt>
          <kbd>Alt</kbd> <kbd>R</kbd>
        </dt>
        <dd>Reset the field</dd>
        <dt>
          <kbd>Ctrl</kbd> <kbd>Space</kbd>
        </dt>
        <dd>Suggest completions</dd>
      </dl>
    </>
  );
}
