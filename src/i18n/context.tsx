import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createTranslator, type Params, type TranslationKey } from './index';
import { DEFAULT_LOCALE, detectLocale, type Locale } from './locales';

interface I18nValue {
  readonly locale: Locale;
  readonly t: (key: TranslationKey, params?: Params) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

/** The language the user chose, or the browser's when they have not chosen one. */
export function resolveLocale(chosen: Locale | null): Locale {
  if (chosen) return chosen;
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;
  return detectLocale(navigator.languages?.length ? navigator.languages : [navigator.language]);
}

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo<I18nValue>(() => ({ locale, t: createTranslator(locale) }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): I18nValue {
  const v = useContext(I18nContext);
  if (!v) throw new Error('useT must be used inside <I18nProvider>');
  return v;
}
