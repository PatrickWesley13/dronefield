import { en } from './en';
import { pt } from './pt-BR';
import { es } from './es';
import { ERROR_CATALOGS } from '../errors';
import type { Locale } from '../locales';

type Catalog = Readonly<Record<string, string>>;

/** Game content catalogs, including interpreter and API error messages. A missing key falls back to the English message in code. */
export const CONTENT_CATALOGS: Readonly<Record<Locale, Catalog>> = {
  en: { ...en, ...ERROR_CATALOGS.en },
  'pt-BR': { ...pt, ...ERROR_CATALOGS['pt-BR'] },
  es: { ...es, ...ERROR_CATALOGS.es },
};
