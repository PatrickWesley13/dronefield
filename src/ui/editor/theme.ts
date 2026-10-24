import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import type { Extension } from '@codemirror/state';

const palette = {
  bg: '#1c2b2d',
  gutter: '#1f3133',
  text: '#dfe8de',
  muted: '#6f8a85',
  line: '#2c4244',
  accent: '#f0bb4a',
  error: '#f07f8c',
};

export const editorTheme: Extension = [
  EditorView.theme(
    {
      '&': { color: palette.text, backgroundColor: palette.bg, height: '100%', fontSize: '13.5px' },
      '.cm-scroller': { fontFamily: 'var(--mono)', lineHeight: '21px', fontVariantLigatures: 'none' },
      '.cm-content': { caretColor: '#ffd36a', padding: '12px 0' },
      '.cm-cursor': { borderLeftColor: '#ffd36a', borderLeftWidth: '2px' },
      '.cm-gutters': { backgroundColor: palette.gutter, color: palette.muted, border: 'none' },
      '.cm-lineNumbers .cm-gutterElement': { padding: '0 10px 0 14px' },
      '.cm-activeLineGutter': { backgroundColor: 'transparent', color: palette.text },
      '.cm-activeLine': { backgroundColor: 'rgba(255,255,255,.03)' },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: 'rgba(240,187,74,.28) !important' },
      '.cm-executing-line': { backgroundColor: 'rgba(240,187,74,.16)', boxShadow: `inset 3px 0 0 ${palette.accent}` },
      '.cm-error-line': { backgroundColor: 'rgba(240,110,125,.18)', boxShadow: `inset 3px 0 0 ${palette.error}` },
      '.cm-tooltip': { backgroundColor: '#233739', border: '1px solid #3b5658', color: palette.text, borderRadius: '9px' },
      '.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: '#33504f', color: palette.text },
      '.cm-completionDetail': { color: palette.muted, fontStyle: 'normal', marginLeft: '10px' },
      '.cm-completionInfo': { maxWidth: '280px', padding: '6px 10px', fontFamily: 'var(--ui)' },
      '&.cm-focused': { outline: 'none' },
    },
    { dark: true },
  ),
  syntaxHighlighting(
    HighlightStyle.define([
      { tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.moduleKeyword, t.operatorKeyword], color: '#f0a6c8' },
      { tag: [t.string, t.special(t.string)], color: '#a9dc8f' },
      { tag: [t.number, t.bool, t.null], color: '#f6c27a' },
      { tag: t.comment, color: '#7c9590', fontStyle: 'italic' },
      { tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#8fd3ea' },
      { tag: [t.definition(t.variableName), t.definition(t.function(t.variableName))], color: '#c6b3f7' },
      { tag: t.propertyName, color: '#9fe0c4' },
      { tag: t.operator, color: '#b9cbc6' },
    ]),
  ),
];
