import { DEFAULT_LOCALE, type Locale } from './locales';
import { en, type MessageKey } from './en';
import { pt } from './pt-BR';
import { es } from './es';

type Catalog = Readonly<Record<string, string>>;

/** Base keys whose text is chosen by count, e.g. t('mission.ticks', { count }). */
export type PluralKey = 'mission.ticks' | 'levels.ticks';

export type TranslationKey = MessageKey | PluralKey;

export const CATALOGS: Readonly<Record<Locale, Catalog>> = {
  en,
  'pt-BR': pt,
  es,
};

export type Params = Readonly<Record<string, string | number>>;

/**
 * Looks up `key` in `catalog`, falling back to English, then to the key itself.
 * A base key with `_one` / `_other` variants is resolved by the numeric `count`.
 * Placeholders look like `{name}`.
 */
export function translate(catalog: Catalog, key: TranslationKey, params: Params = {}): string {
  const count = params.count;
  let template: string | undefined;
  if (typeof count === 'number') {
    const form = `${key}${count === 1 ? '_one' : '_other'}`;
    template = catalog[form] ?? en[form as MessageKey];
  }
  template ??= catalog[key] ?? en[key as MessageKey] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
}

export function createTranslator(locale: Locale): (key: TranslationKey, params?: Params) => string {
  const catalog = CATALOGS[locale] ?? CATALOGS[DEFAULT_LOCALE];
  return (key, params) => translate(catalog, key, params);
}
