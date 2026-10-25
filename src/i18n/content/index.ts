import { en } from './en';
import { pt } from './pt-BR';
import { es } from './es';
import type { Locale } from '../locales';

type Catalog = Readonly<Record<string, string>>;

/** Game content catalogs. A missing key falls back to the English message in code. */
export const CONTENT_CATALOGS: Readonly<Record<Locale, Catalog>> = {
  en,
  'pt-BR': pt,
  es,
};
