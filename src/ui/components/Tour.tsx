import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useT } from '@/i18n/context';
import type { MessageKey } from '@/i18n/en';
import type { SideTab } from './side/SidePanel';

interface TourStep {
  readonly target?: string;
  readonly tab?: SideTab;
  readonly titleKey: MessageKey;
  readonly textKey: MessageKey;
}

const STEPS: readonly TourStep[] = [
  { titleKey: 'tour.welcome.title', textKey: 'tour.welcome.text' },
  { target: '.stage', titleKey: 'tour.field.title', textKey: 'tour.field.text' },
  { target: '.editor', titleKey: 'tour.program.title', textKey: 'tour.program.text' },
  { target: '.toolbar .btn--primary', titleKey: 'tour.run.title', textKey: 'tour.run.text' },
  { target: '#speed-control', titleKey: 'tour.speed.title', textKey: 'tour.speed.text' },
  { target: '#console', titleKey: 'tour.console.title', textKey: 'tour.console.text' },
  { target: '.side', tab: 'mission', titleKey: 'tour.mission.title', textKey: 'tour.mission.text' },
  { target: '#tab-reference', tab: 'reference', titleKey: 'tour.reference.title', textKey: 'tour.reference.text' },
  { target: '#tab-upgrades', tab: 'upgrades', titleKey: 'tour.upgrades.title', textKey: 'tour.upgrades.text' },
  { titleKey: 'tour.ready.title', textKey: 'tour.ready.text' },
];

interface Placement {
  spot: React.CSSProperties;
  card: React.CSSProperties;
}

export function Tour({ onTab, onClose }: { onTab: (tab: SideTab) => void; onClose: () => void }) {
  const { t } = useT();
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
        <h3 id="tour-title">{t(step.titleKey)}</h3>
        <p>{t(step.textKey)}</p>
        <div className="tour__actions">
          <span className="tour__count">{t('tour.count', { index: index + 1, total: STEPS.length })}</span>
          <button className="btn" onClick={onClose}>
            {t('app.skipTour')}
          </button>
          {index > 0 && (
            <button className="btn" onClick={() => setIndex(index - 1)}>
              {t('app.back')}
            </button>
          )}
          <button className="btn btn--primary" ref={next} onClick={advance}>
            {last ? t('tour.start') : t('app.next')}
          </button>
        </div>
      </div>
    </div>
  );
}
