import type { GameNotices } from '@/api';
import type { ConsoleLevel, ScriptConsole } from '@/interpreter';
import { Emitter } from '@/shared/emitter';
import type { Message } from '@/shared/message';

export type LogKind = 'out' | 'info' | 'warn' | 'error' | 'success' | 'hint' | 'summary';

export interface LogEntry {
  readonly id: number;
  readonly kind: LogKind;
  readonly text: string;
  /** Translatable form of a game message. When set, the UI shows it instead of `text`. */
  readonly message: Message | null;
  readonly line: number | null;
  /** Consecutive identical messages are collapsed into one entry. */
  readonly repeat: number;
}

const LEVEL_KIND: Readonly<Record<ConsoleLevel, LogKind>> = { log: 'out', info: 'info', warn: 'warn', error: 'error' };
const MAX_ENTRIES = 400;

/** The in-game console. Adapts to the interpreter's ScriptConsole and the API's GameNotices. */
export class ConsoleLog {
  readonly changes = new Emitter<void>();
  private items: LogEntry[] = [];
  private nextId = 1;

  get entries(): readonly LogEntry[] {
    return this.items;
  }

  add(kind: LogKind, text: string, line: number | null = null): void {
    this.push(kind, text, null, line);
  }

  /** Adds a game message the UI translates. `message.fallback` is the English text. */
  addMessage(kind: LogKind, message: Message, line: number | null = null): void {
    this.push(kind, message.fallback, message, line);
  }

  clear(): void {
    this.items = [];
    this.changes.emit();
  }

  private push(kind: LogKind, text: string, message: Message | null, line: number | null): void {
    const last = this.items.at(-1);
    const sameMessage = last?.message?.key === message?.key;
    if (last && last.kind === kind && last.text === text && last.line === line && sameMessage) {
      this.items = [...this.items.slice(0, -1), { ...last, repeat: last.repeat + 1 }];
    } else {
      this.items = [...this.items.slice(-(MAX_ENTRIES - 1)), { id: this.nextId++, kind, text, message, line, repeat: 1 }];
    }
    this.changes.emit();
  }

  /** Player output from console.log & co. */
  readonly scriptConsole: ScriptConsole = {
    write: (level, text) => this.add(LEVEL_KIND[level], text),
    clear: () => this.clear(),
  };

  /** Game warnings such as a blocked move. */
  readonly notices: GameNotices = { warn: (text) => (typeof text === 'string' ? this.add('warn', text) : this.addMessage('warn', text)) };
}
