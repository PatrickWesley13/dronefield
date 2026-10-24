import { CROPS, costEntries, type Cost, type CropId } from '@/domain/crops';
import { useT } from '@/i18n/context';
import { formatCount } from '../format';

const PATHS: Readonly<Record<CropId, JSX.Element>> = {
  wheat: (
    <>
      <path d="M8 15V5" stroke="#b9892a" strokeWidth="1.4" />
      <ellipse cx="8" cy="4" rx="2" ry="3.2" fill="#f0c048" />
      <ellipse cx="5.4" cy="8" rx="1.6" ry="2.6" fill="#e9b33a" transform="rotate(-25 5.4 8)" />
      <ellipse cx="10.6" cy="8" rx="1.6" ry="2.6" fill="#e9b33a" transform="rotate(25 10.6 8)" />
    </>
  ),
  carrot: (
    <>
      <path d="M4.5 7.5h7L8 15z" fill="#ef8a3a" />
      <path
        d="M8 7C7 4 5 2.5 4 2.8M8 7c0-2.5 0-4.5 1-5.5M8 7c1-2.2 2.6-3.6 4-3.6"
        stroke="#5aa651"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),
  tomato: (
    <>
      <circle cx="8" cy="9.5" r="5.2" fill="#e5483f" />
      <path d="M5 5.5l3 1.5 3-1.5-1 2.3H6z" fill="#4f9e48" />
      <circle cx="6" cy="8" r="1.1" fill="#ff8f86" />
    </>
  ),
  crystal: (
    <>
      <path d="M8 1l4.5 5L8 15 3.5 6z" fill="#a983f0" />
      <path d="M8 1l4.5 5H3.5z" fill="#c9b2ff" />
    </>
  ),
};

export function CropIcon({ crop }: { crop: CropId }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      {PATHS[crop]}
    </svg>
  );
}

export function CropChip({ crop, amount, short = false }: { crop: CropId; amount: number; short?: boolean }) {
  return (
    <span className={`chip${short ? ' chip--short' : ''}`} title={CROPS[crop].label}>
      <CropIcon crop={crop} />
      <span className="sr-only">{CROPS[crop].label}</span>
      {formatCount(amount)}
    </span>
  );
}

export function CostChips({ cost, have }: { cost: Cost; have?: Readonly<Record<CropId, number>> }) {
  const { t } = useT();
  const entries = costEntries(cost);
  if (!entries.length) return <span className="chip">{t('app.free')}</span>;
  return (
    <>
      {entries.map(([id, n]) => (
        <CropChip key={id} crop={id} amount={n} short={!!have && have[id] < n} />
      ))}
    </>
  );
}
