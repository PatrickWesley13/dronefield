import { useRef, type KeyboardEvent } from 'react';
import { LevelsTab } from './LevelsTab';
import { MissionTab } from './MissionTab';
import { ReferenceTab } from './ReferenceTab';
import { UpgradesTab } from './UpgradesTab';

export type SideTab = 'mission' | 'levels' | 'upgrades' | 'reference';
const TABS: ReadonlyArray<{ id: SideTab; label: string }> = [
  { id: 'mission', label: 'Mission' },
  { id: 'levels', label: 'Levels' },
  { id: 'upgrades', label: 'Upgrades' },
  { id: 'reference', label: 'Reference' },
];

export interface SidePanelProps {
  readonly tab: SideTab;
  readonly onTabChange: (tab: SideTab) => void;
  readonly onInsertCode: (text: string) => void;
}

export function SidePanel({ tab, onTabChange, onInsertCode }: SidePanelProps) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const next = (i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length;
    onTabChange(TABS[next]!.id);
    buttons.current[next]?.focus();
  };
  return (
    <aside className="side" aria-label="Progress">
      <div className="tabs" role="tablist">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => (buttons.current[i] = el)}
            id={`tab-${t.id}`}
            className="tab"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`pane-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => onTabChange(t.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="pane" id={`pane-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'mission' && <MissionTab onShowReference={() => onTabChange('reference')} />}
        {tab === 'levels' && <LevelsTab onSelected={() => onTabChange('mission')} />}
        {tab === 'upgrades' && <UpgradesTab />}
        {tab === 'reference' && <ReferenceTab onInsert={onInsertCode} />}
      </div>
    </aside>
  );
}
