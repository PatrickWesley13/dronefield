import { CROP_IDS, isCropId, type CropId } from '@/domain/crops';
import type { FarmSnapshot } from '@/domain/farmSnapshot';
import { SAVE_VERSION, SANDBOX_ID, createDefaultSave, type BestRun, type SaveData, type Settings, type SpeedLevel } from './saveData';

type Raw = Record<string, unknown>;
const isRecord = (v: unknown): v is Raw => !!v && typeof v === 'object' && !Array.isArray(v);

/** v1 (the first single-file release) → v2: field renames, `print` replaced by console.log. */
function migrateV1(raw: Raw): Raw {
  const settings = isRecord(raw.settings) ? raw.settings : {};
  const motion = settings.motion === 'on' ? 'full' : settings.motion === 'off' ? 'reduced' : settings.motion;
  return {
    ...raw,
    version: 2,
    unlockedFunctions: Array.isArray(raw.unlockedFns) ? raw.unlockedFns.filter((f) => f !== 'print') : undefined,
    currentLevel: raw.current,
    settings: { ...settings, motion, showCoordinates: settings.coords },
    lifetime: isRecord(raw.lifetime) ? { ...raw.lifetime, harvests: raw.lifetime.harvested } : undefined,
    farm: isRecord(raw.farm)
      ? { width: raw.farm.w, height: raw.farm.h, tick: raw.farm.tick, drone: raw.farm.drone, tiles: raw.farm.tiles }
      : null,
  };
}

const MIGRATIONS: Readonly<Record<number, (raw: Raw) => Raw>> = { 1: migrateV1 };

export interface MigrationContext {
  readonly knownLevels: ReadonlySet<string>;
  readonly knownFunctions: ReadonlySet<string>;
  readonly knownUpgrades: ReadonlySet<string>;
}

/** Brings any older save up to date and validates every field. Returns null if unusable. */
export function migrateSave(input: unknown, ctx: MigrationContext): SaveData | null {
  if (!isRecord(input) || typeof input.version !== 'number') return null;
  let raw = input;
  for (let v = raw.version as number; v < SAVE_VERSION; v++) {
    const step = MIGRATIONS[v];
    if (!step) return null;
    raw = step(raw);
  }
  if (raw.version !== SAVE_VERSION) return null;
  return sanitize(raw, ctx);
}

function sanitize(raw: Raw, ctx: MigrationContext): SaveData {
  const base = createDefaultSave();
  const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  const flags = (v: unknown, known: ReadonlySet<string>): Record<string, true> =>
    isRecord(v)
      ? Object.fromEntries(
          Object.keys(v)
            .filter((k) => known.has(k) && v[k])
            .map((k) => [k, true as const]),
        )
      : {};

  const bank = { ...base.bank } as Record<CropId, number>;
  if (isRecord(raw.bank))
    for (const id of CROP_IDS) {
      const n = raw.bank[id];
      if (typeof n === 'number' && Number.isFinite(n) && n >= 0) bank[id] = Math.floor(n);
    }

  const code: Record<string, string> = {};
  if (isRecord(raw.code)) for (const [k, v] of Object.entries(raw.code)) if (typeof v === 'string' && v.length < 200_000) code[k] = v;

  const best: Record<string, BestRun> = {};
  if (isRecord(raw.best))
    for (const [k, v] of Object.entries(raw.best)) {
      if (isRecord(v) && typeof v.ticks === 'number' && Number.isFinite(v.ticks))
        best[k] = { ticks: v.ticks, actions: Number(v.actions) | 0, instructions: Number(v.instructions) | 0 };
    }

  const s = isRecord(raw.settings) ? raw.settings : {};
  const settings: Settings = {
    speed: (Number.isInteger(s.speed) && (s.speed as number) >= 1 && (s.speed as number) <= 6
      ? s.speed
      : base.settings.speed) as SpeedLevel,
    sound: typeof s.sound === 'boolean' ? s.sound : base.settings.sound,
    motion: s.motion === 'full' || s.motion === 'reduced' || s.motion === 'auto' ? s.motion : base.settings.motion,
    showCoordinates: typeof s.showCoordinates === 'boolean' ? s.showCoordinates : base.settings.showCoordinates,
    theme: s.theme === 'light' || s.theme === 'dark' || s.theme === 'system' ? s.theme : base.settings.theme,
  };

  const lt = isRecord(raw.lifetime) ? raw.lifetime : {};
  const count = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);

  const level =
    typeof raw.currentLevel === 'string' && (raw.currentLevel === SANDBOX_ID || ctx.knownLevels.has(raw.currentLevel))
      ? raw.currentLevel
      : base.currentLevel;

  return {
    version: SAVE_VERSION,
    completed: flags(raw.completed, ctx.knownLevels),
    unlockedFunctions: [
      ...new Set([...base.unlockedFunctions, ...strings(raw.unlockedFunctions).filter((f) => ctx.knownFunctions.has(f))]),
    ],
    unlockedCrops: [...new Set<CropId>(['wheat', ...strings(raw.unlockedCrops).filter(isCropId)])],
    bank,
    upgrades: flags(raw.upgrades, ctx.knownUpgrades),
    currentLevel: level,
    code,
    best,
    farm: sanitizeFarm(raw.farm),
    settings,
    tutorialDone: raw.tutorialDone === true,
    lifetime: { runs: count(lt.runs), harvests: count(lt.harvests), actions: count(lt.actions), instructions: count(lt.instructions) },
  };
}

function sanitizeFarm(v: unknown): FarmSnapshot | null {
  if (!isRecord(v) || !Array.isArray(v.tiles) || !Number.isInteger(v.width) || !Number.isInteger(v.height)) return null;
  const drone = isRecord(v.drone) ? { x: Number(v.drone.x) || 0, y: Number(v.drone.y) || 0 } : { x: 0, y: 0 };
  const grounds = new Set(['soil', 'grass', 'rock', 'water']);
  const tiles: FarmSnapshot['tiles'][number][] = v.tiles.map((t: unknown) => {
    const a = Array.isArray(t) ? t : [];
    const ground = (grounds.has(a[0]) ? a[0] : 'soil') as FarmSnapshot['tiles'][number][0];
    return isCropId(a[1]) ? [ground, a[1], Number(a[2]) || 0, a[3] === 1 ? 1 : 0] : [ground];
  });
  return { width: v.width as number, height: v.height as number, tick: Number(v.tick) || 0, drone, tiles };
}
