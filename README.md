# Dronefield: Automated Harvest

A farming automation game where you program a drone in JavaScript. Write code, watch the drone fly the field, plant and harvest, then optimise your program across ten missions and an open sandbox farm.

## Quick start

Requires Node.js 20+.

```bash
npm ci            # install exact dependency versions
npm run dev       # start the dev server at http://localhost:5173
npm test          # unit and integration tests (Vitest)
npm run build     # type-check and build dist/index.html
npm run test:e2e  # browser tests (Playwright) against the production build
npm run check     # everything CI runs, except e2e
```

`npm run build` produces a single self-contained `dist/index.html`. Upload it to any static host (Netlify, Vercel, GitHub Pages, S3). There is no backend; progress is saved in the browser's `localStorage`.

## Architecture

The code is split into layers. Each layer depends only on the layers listed before it, and ESLint enforces this (`no-restricted-imports` in `eslint.config.js`).

| Layer        | Folder                              | Responsibility                                                                                              |
| ------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Shared       | `src/shared`                        | Tiny utilities with no game knowledge (typed `Emitter`).                                                    |
| Domain       | `src/domain`                        | Pure game rules: grid, crops, inventory, drone actions, time. No I/O.                                       |
| Interpreter  | `src/interpreter`                   | Parses player code with Acorn and runs it step by step in a sandbox. Knows nothing about farming.           |
| Drone API    | `src/api`                           | The functions the drone exposes (`move`, `harvest`…), as a declarative registry bound into the interpreter. |
| Missions     | `src/missions`                      | Mission data, maps, objectives and failure rules.                                                           |
| Persistence  | `src/persistence`                   | Versioned save format, migrations, validation and storage repositories.                                     |
| Progression  | `src/progression`                   | Pure state transitions over the save: unlocks, rewards, upgrades, sandbox loadout.                          |
| Runtime      | `src/runtime`                       | `ProgramRun` (one program on one farm) and `Playback` (pacing, pause, step, stop).                          |
| Application  | `src/app`                           | `GameController`, the single entry point the UI calls; exposes an immutable snapshot.                       |
| Presentation | `src/render`, `src/audio`, `src/ui` | Canvas renderer, synthesized sound, React components and the CodeMirror editor.                             |

`src/main.tsx` is the composition root: it is the only file that picks concrete implementations (Web Storage, Web Audio) and wires them together.

### How a run works

1. `parseProgram` parses the source with Acorn and rejects unsupported syntax before anything runs.
2. `ProgramRun` builds the global scope from the standard library and the _unlocked_ drone functions only, then creates an `Interpreter`.
3. The interpreter is a generator: every statement yields a `step`, every drone action yields an `action`. Nothing runs ahead of the caller.
4. `Playback` pulls steps once per animation frame, pacing actions by the chosen speed with a bounded amount of work per frame, so the page never freezes.
5. After each action `ProgramRun` evaluates the mission's objectives and failure rules and ends the run when one is decided.

### Design principles applied

- **Single responsibility.** The farm only applies rules, the interpreter only executes code, `Playback` only paces, the renderer only draws, and `GameController` only coordinates.
- **Open for extension.** Crops, drone functions, standard-library modules, array/string methods, objectives, upgrades, ground and crop painters, and migrations are all registries or tables. New behaviour is added by adding an entry, not by editing a switch.
- **Liskov and interface segregation.** Small interfaces (`SaveRepository`, `SoundPlayer`, `ScriptConsole`, `GameNotices`, `Objective`, `FailureRule`) with interchangeable implementations: `InMemorySaveRepository` in tests, `DebouncedSaveRepository` decorating `WebStorageSaveRepository` in the app, `silentSoundPlayer` in tests.
- **Dependency inversion.** High-level code receives its dependencies (clock, storage, sound, unlock hints) through constructors. The interpreter learns about the game only through the bindings it is given.
- **Immutability at the edges.** `SaveData` is never mutated; progression functions return new saves, which makes React rendering and testing straightforward.

### Sandbox guarantees

Player code is never passed to `eval`, `new Function` or a `<script>` tag (also enforced by lint rules). Script objects have a `null` prototype, prototype keys are blocked, and only explicitly provided globals exist. `try`/`catch` is not supported so limits cannot be caught. Every run has an instruction limit, an idle-loop detector, a recursion limit and collection size limits, and `Math.random` is seeded so runs are reproducible.

## Extending the game

- **Crop:** add it to `CROPS` in `src/domain/crops.ts` and a painter to `CROP_PAINTERS` in `src/render/sprites/crops.ts`. TypeScript flags any other table that needs an entry.
- **Drone function:** add an `ApiFunction` to one of the lists in `src/api/functions/`, then teach it in a mission (`introduces`) or unlock it with an upgrade (`unlocksFunction`).
- **Mission:** add an entry to `MISSIONS` in `src/missions/catalog.ts`, composing objectives from `src/missions/objectives.ts`, and add a solution to `tests/missions.test.ts`.
- **Upgrade:** add an entry to `UPGRADES` with a `modifyLoadout`, `unlocksFunction` or `unlocksCrop`.
- **Save format change:** bump `SAVE_VERSION`, add a migration to `MIGRATIONS` in `src/persistence/migrations.ts`, and cover it in `tests/persistence.test.ts`.

## Tests

- `tests/` (Vitest): interpreter semantics and errors, sandbox safety, standard library, farm rules, every mission solved by a correct program and _not_ solved by its starter code, progression, save migrations and corruption handling, playback pacing with a fake clock, and `GameController` flows.
- `e2e/` (Playwright): tour, playing and persisting a mission, console output and hints, syntax errors, pause/resume/step/stop, and editor autocomplete.

To run e2e against a specific Chromium build, set `CHROMIUM_PATH`.

## Known limitations

- Graphics are drawn with simple canvas shapes and sounds are synthesized; there are no art or audio assets.
- Mission scores use a standard drone; upgrades only affect the sandbox farm.
- The production bundle is about 830 kB (270 kB gzipped), mostly React and CodeMirror.
