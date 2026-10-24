import { describe, expect, it } from 'vitest';
import { CATALOGS, createTranslator, translate } from '@/i18n';
import { detectLocale, isLocale, LOCALES } from '@/i18n/locales';
import { en } from '@/i18n/en';

describe('translations', () => {
  it('every locale provides exactly the English keys', () => {
    for (const locale of LOCALES) {
      expect(Object.keys(CATALOGS[locale]).sort()).toEqual(Object.keys(en).sort());
    }
  });

  it('interpolates named placeholders', () => {
    const t = createTranslator('pt-BR');
    expect(t('top.missionOf', { index: 2, total: 10 })).toBe('missão 2 de 10');
  });

  it('picks the plural form from count', () => {
    const t = createTranslator('en');
    expect(t('mission.ticks', { count: 1 })).toBe('1 tick');
    expect(t('mission.ticks', { count: 2 })).toBe('2 ticks');
  });

  it('falls back to English for a missing key, then to the key itself', () => {
    expect(translate({}, 'app.next')).toBe('Next');
    expect(translate({}, 'app.next', {})).toBe('Next');
  });

  it('keeps unknown placeholders visible instead of hiding them', () => {
    expect(translate(en, 'stage.position', { x: 3 })).toBe('x 3, y {y}');
  });
});

describe('locale detection', () => {
  it('maps Portuguese and Spanish variants and defaults to English', () => {
    expect(detectLocale(['pt-PT'])).toBe('pt-BR');
    expect(detectLocale(['es-MX', 'en'])).toBe('es');
    expect(detectLocale(['fr-FR', 'en-US'])).toBe('en');
    expect(detectLocale(['fr-FR'])).toBe('en');
    expect(detectLocale([])).toBe('en');
  });

  it('recognises only supported locales', () => {
    expect(isLocale('pt-BR')).toBe(true);
    expect(isLocale('pt')).toBe(false);
    expect(isLocale(null)).toBe(false);
  });
});
