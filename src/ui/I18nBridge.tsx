import type { ReactNode } from 'react';
import { I18nProvider, resolveLocale } from '@/i18n/context';
import { useGame } from './GameContext';

/** Reads the chosen language from the save and provides translations to the whole UI. */
export function I18nBridge({ children }: { children: ReactNode }) {
  const { save } = useGame();
  return <I18nProvider locale={resolveLocale(save.settings.language)}>{children}</I18nProvider>;
}
