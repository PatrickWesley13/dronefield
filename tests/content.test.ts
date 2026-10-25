import { describe, expect, it } from 'vitest';
import { CONTENT_CATALOGS } from '@/i18n/content';
import { briefingText, missionText, translateKey } from '@/i18n/messages';
import { MISSIONS } from '@/missions';

describe('game content translations', () => {
  it('every locale catalog is wired to a real translation, not an empty object', () => {
    expect(Object.keys(CONTENT_CATALOGS['pt-BR']).length).toBeGreaterThan(0);
    expect(Object.keys(CONTENT_CATALOGS.es).length).toBeGreaterThan(0);
  });

  it('resolves mission titles in each locale', () => {
    expect(missionText('en', 'm1', 'title', 'x')).toBe('First Flight');
    expect(missionText('pt-BR', 'm1', 'title', 'x')).toBe('Primeiro voo');
    expect(missionText('es', 'm1', 'title', 'x')).not.toBe('First Flight');
  });

  it('falls back to the domain English text for an unknown key', () => {
    expect(translateKey('pt-BR', 'mission.nope.title', {}, 'Fallback')).toBe('Fallback');
  });

  it('covers every mission briefing line in each locale', () => {
    for (const m of MISSIONS) {
      m.briefing.forEach((line, i) => {
        expect(briefingText('pt-BR', m.id, i, line), `${m.id}.${i}`).not.toBe(line);
        expect(briefingText('es', m.id, i, line), `${m.id}.${i}`).not.toBe(line);
      });
    }
  });
});
