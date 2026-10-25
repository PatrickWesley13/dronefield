import { CONTENT_CATALOGS } from './content';
import type { Locale } from './locales';
import type { Message } from '@/shared/message';

/** Translates a game message: its catalog key first, then the English fallback. */
export function translateMessage(locale: Locale, message: Message): string {
  return translateKey(locale, message.key, message.params, message.fallback);
}

/**
 * Translates a content key, falling back to English when the locale has no entry,
 * and then to `fallback` (the English text carried by the domain object).
 */
export function translateKey(locale: Locale, key: string, params: Readonly<Record<string, string | number>> = {}, fallback = key): string {
  const template = CONTENT_CATALOGS[locale]?.[key] ?? CONTENT_CATALOGS.en[key] ?? fallback;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
}

/** Mission text (title, concept, briefing line) keyed by the mission id. */
export function missionText(locale: Locale, id: string, field: 'title' | 'concept', fallback: string): string {
  return translateKey(locale, `mission.${id}.${field}`, {}, fallback);
}

export function briefingText(locale: Locale, id: string, index: number, fallback: string): string {
  return translateKey(locale, `mission.${id}.briefing.${index}`, {}, fallback);
}
