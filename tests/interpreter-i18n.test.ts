import { describe, expect, it } from 'vitest';
import { parseProgram, isScriptError } from '@/interpreter';
import { translateMessage } from '@/i18n/messages';

function errorMessage(source: string): unknown {
  try {
    parseProgram(source);
  } catch (e) {
    if (isScriptError(e)) return e.message_;
  }
  return null;
}

describe('interpreter error translations', () => {
  it('keeps the English text on the Error message', () => {
    expect(String(errorMessage('let = ;') && (errorMessage('let = ;') as { fallback: string }).fallback)).toMatch(/Syntax error/);
  });

  it('translates a syntax error into Portuguese', () => {
    const m = errorMessage('let = ;');
    expect(m).not.toBeNull();
    const pt = translateMessage('pt-BR', m as never);
    expect(pt).toMatch(/Erro de sintaxe/);
  });
});
