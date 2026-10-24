import { useRef, type KeyboardEvent } from 'react';
import { useT } from '@/i18n/context';
import type { MessageKey } from '@/i18n/en';
import { LevelsTab } from './LevelsTab';
import { MissionTab } from './MissionTab';
import { ReferenceTab } from './ReferenceTab';
import { UpgradesTab } from './UpgradesTab';

export type SideTab = 'mission' | 'levels' | 'upgrades' | 'reference';
const TABS: ReadonlyArray<{ id: SideTab; label: MessageKey }> = [
  { id: 'mission', label: 'side.tab.mission' },
  { id: 'levels', label: 'side.tab.levels' },
  { id: 'upgrades', label: 'side.tab.upgrades' },
  { id: 'reference', label: 'side.tab.reference' },
];

export interface SidePanelProps {
  readonly tab: SideTab;
  readonly onTabChange: (tab: SideTab) => void;
  readonly onInsertCode: (text: string) => void;
}

export function SidePanel({ tab, onTabChange, onInsertCode }: SidePanelProps) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const { t } = useT();
  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const next = (i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length;
    onTabChange(TABS[next]!.id);
    buttons.current[next]?.focus();
  };
  return (
    <aside className="side" aria-label={t('side.label')}>
      <div className="tabs" role="tablist">
        {TABS.map((tabDef, i) => (
          <button
            key={tabDef.id}
            ref={(el) => (buttons.current[i] = el)}
            id={`tab-${tabDef.id}`}
            className="tab"
            role="tab"
            aria-selected={tab === tabDef.id}
            aria-controls={`pane-${tabDef.id}`}
            tabIndex={tab === tabDef.id ? 0 : -1}
            onClick={() => onTabChange(tabDef.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t(tabDef.label)}
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
