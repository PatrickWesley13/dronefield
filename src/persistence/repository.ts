import { migrateSave, type MigrationContext } from './migrations';
import { createDefaultSave, type SaveData } from './saveData';

export type LoadResult = { readonly save: SaveData; readonly notice: string | null };

export interface SaveRepository {
  load(): LoadResult;
  save(data: SaveData): boolean;
  /** Write anything still pending (before the page unloads). */
  flush?(): void;
}

/** Persists saves in Web Storage (localStorage). Unreadable data is backed up, never thrown away. */
export class WebStorageSaveRepository implements SaveRepository {
  constructor(
    private readonly storage: Pick<Storage, 'getItem' | 'setItem'> | null,
    private readonly ctx: MigrationContext,
    private readonly key = 'dronefield.save',
  ) {}

  load(): LoadResult {
    let raw: string | null = null;
    try {
      raw = this.storage?.getItem(this.key) ?? null;
    } catch {
      return { save: createDefaultSave(), notice: 'Saving is unavailable in this browser, so progress won’t be kept.' };
    }
    if (raw === null) return { save: createDefaultSave(), notice: null };
    try {
      const migrated = migrateSave(JSON.parse(raw), this.ctx);
      if (migrated) return { save: migrated, notice: null };
    } catch {
      /* fall through to backup */
    }
    try {
      this.storage?.setItem(`${this.key}.backup`, raw);
    } catch {
      /* best effort */
    }
    return {
      save: createDefaultSave(),
      notice: 'Your saved game couldn’t be read, so a fresh one started. The old data is kept as a backup in this browser.',
    };
  }

  save(data: SaveData): boolean {
    try {
      this.storage?.setItem(this.key, JSON.stringify(data));
      return !!this.storage;
    } catch {
      return false;
    }
  }
}

export class InMemorySaveRepository implements SaveRepository {
  constructor(private data: SaveData | null = null) {}
  load(): LoadResult {
    return { save: this.data ?? createDefaultSave(), notice: null };
  }
  save(data: SaveData): boolean {
    this.data = data;
    return true;
  }
  get current(): SaveData | null {
    return this.data;
  }
}

/** Decorator that coalesces frequent writes (e.g. typing) into one write per quiet period. */
export class DebouncedSaveRepository implements SaveRepository {
  private pending: SaveData | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly inner: SaveRepository,
    private readonly delayMs = 300,
  ) {}

  load(): LoadResult {
    return this.inner.load();
  }

  save(data: SaveData): boolean {
    this.pending = data;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), this.delayMs);
    return true;
  }

  flush(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (this.pending) this.inner.save(this.pending);
    this.pending = null;
  }
}
