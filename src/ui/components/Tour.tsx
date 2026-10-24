import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { SideTab } from './side/SidePanel';

interface TourStep {
  readonly target?: string;
  readonly tab?: SideTab;
  readonly title: string;
  readonly text: string;
}

const STEPS: readonly TourStep[] = [
  {
    title: 'Welcome, operator',
    text: 'Dronefield’s harvest drone does nothing on its own. You write the program, it does the farming. This quick tour shows you around.',
  },
  {
    target: '.stage',
    title: 'The field',
    text: 'This is where your drone works. x counts columns from the west, y counts rows from the south, so the bottom-left tile is x 0, y 0. North is up.',
  },
  {
    target: '.editor',
    title: 'Your program',
    text: 'Write JavaScript here. Each mission comes with starter code you can change. Suggestions appear as you type.',
  },
  {
    target: '.toolbar .btn--primary',
    title: 'Run it',
    text: 'Run executes your program in the field. Step runs one line at a time so you can watch exactly what happens. Ctrl+Enter also runs.',
  },
  {
    target: '#speed-control',
    title: 'Speed',
    text: 'Slow it down to follow along, or set Instant for long programs. Speed only changes the animation, never the result.',
  },
  {
    target: '#console',
    title: 'The console',
    text: 'console.log() writes here. When something goes wrong, the error names the line it happened on. Click the line number to jump to it.',
  },
  {
    target: '.side',
    tab: 'mission',
    title: 'Your mission',
    text: 'Each mission teaches one idea. Objectives tick off as you meet them, and the mission ends as soon as they’re all done.',
  },
  {
    target: '#tab-reference',
    tab: 'reference',
    title: 'Reference',
    text: 'Every function you’ve unlocked, with examples. New functions unlock as you progress.',
  },
  {
    target: '#tab-upgrades',
    tab: 'upgrades',
    title: 'Upgrades',
    text: 'After the third mission you get your own farm. Its harvests buy upgrades: faster rotors, more space, new seeds and new functions.',
  },
  { title: 'Ready for take-off', text: 'Start with First Flight. Change the code so the drone reaches the beacon, then press Run.' },
];

interface Placement {
  spot: React.CSSProperties;
  card: React.CSSProperties;
}

export function Tour({ onTab, onClose }: { onTab: (tab: SideTab) => void; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const step = STEPS[index]!;
  const last = index === STEPS.length - 1;

  useEffect(() => {
    if (step.tab) onTab(step.tab);
  }, [step, onTab]);

  const place = useCallback(() => {
    const vw = window.innerWidth,
      vh = window.innerHeight;
    const cw = Math.min(340, vw - 24),
      ch = card.current?.offsetHeight ?? 180;
    const target = step.target ? document.querySelector(step.target) : null;
    if (!target) {
      setPlacement({ spot: { left: vw / 2, top: vh / 2, width: 0, height: 0 }, card: { left: (vw - cw) / 2, top: (vh - ch) / 2 } });
      return;
    }
    target.scrollIntoView({ block: 'nearest' });
    const r = target.getBoundingClientRect();
    let left = r.right + 16,
      top = r.top;
    if (left + cw > vw - 12) left = r.left - cw - 16;
    if (left < 12) {
      left = Math.max(12, Math.min(vw - cw - 12, r.left));
      top = r.bottom + 14 + ch > vh - 12 ? r.top - ch - 14 : r.bottom + 14;
    }
    top = Math.max(12, Math.min(vh - ch - 12, top));
    setPlacement({ spot: { left: r.left - 6, top: r.top - 6, width: r.width + 12, height: r.height + 12 }, card: { left, top } });
  }, [step]);

  useLayoutEffect(() => {
    place();
    next.current?.focus();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [place]);

  const advance = () => {
    if (last) onClose();
    else setIndex(index + 1);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowRight') advance();
    else if (e.key === 'ArrowLeft' && index > 0) setIndex(index - 1);
    else if (e.key === 'Tab') {
      const buttons = Array.from(card.current?.querySelectorAll('button') ?? []);
      const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
      e.preventDefault();
      buttons[(i + (e.shiftKey ? buttons.length - 1 : 1)) % buttons.length]?.focus();
    }
  };

  return (
    <div className="tour" onKeyDown={onKey}>
      <div className="tour__spot" style={placement?.spot} />
      <div className="tour__card" ref={card} style={placement?.card} role="dialog" aria-modal="true" aria-labelledby="tour-title">
        <h3 id="tour-title">{step.title}</h3>
        <p>{step.text}</p>
        <div className="tour__actions">
          <span className="tour__count">
            {index + 1} of {STEPS.length}
          </span>
          <button className="btn" onClick={onClose}>
            Skip tour
          </button>
          {index > 0 && (
            <button className="btn" onClick={() => setIndex(index - 1)}>
              Back
            </button>
          )}
          <button className="btn btn--primary" ref={next} onClick={advance}>
            {last ? 'Start playing' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
