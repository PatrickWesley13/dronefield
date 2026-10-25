import { apiEn } from './api.en';
import { interpreterEn } from './interpreter.en';
import { stdlibEn } from './stdlib.en';
import { errorsPt } from './pt-BR';
import { errorsEs } from './es';
import type { Locale } from '../locales';

type Catalog = Readonly<Record<string, string>>;

/** Interpreter, stdlib and drone API error and warning messages, per locale. */
export const ERROR_CATALOGS: Readonly<Record<Locale, Catalog>> = {
  en: { ...interpreterEn, ...stdlibEn, ...apiEn },
  'pt-BR': errorsPt,
  es: errorsEs,
};
