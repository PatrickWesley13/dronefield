import { useEffect, useRef } from 'react';
import type { LogKind } from '@/app/consoleLog';
import { useConsoleEntries, useController } from '../../GameContext';

const KIND_CLASS: Readonly<Record<LogKind, string>> = {
  out: '',
  info: 'log--info',
  warn: 'log--warn',
  error: 'log--error',
  success: 'log--success',
  hint: 'log--hint',
  summary: 'log--summary',
};

export function ConsolePanel({ onGotoLine }: { onGotoLine: (line: number) => void }) {
  const entries = useConsoleEntries();
  const { log } = useController();
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);
  return (
    <section className="console" aria-label="Console" id="console">
      <div className="console__head">
        <h2>Console</h2>
        <button className="btn btn--small" onClick={() => log.clear()}>
          Clear
        </button>
      </div>
      <div className="console__log" ref={list} role="log" aria-live="polite">
        {entries.length === 0 && <p className="console__empty">console.log() output, warnings and errors show up here.</p>}
        {entries.map((e) => (
          <div key={e.id} className={KIND_CLASS[e.kind]}>
            {e.line !== null && (
              <>
                <button className="console__line" onClick={() => onGotoLine(e.line!)}>
                  Line {e.line}
                </button>
                :{' '}
              </>
            )}
            {e.text}
            {e.repeat > 1 && <span className="console__repeat"> ×{e.repeat.toLocaleString('en-US')}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}
