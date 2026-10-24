import { StateEffect, StateField, type Extension } from '@codemirror/state';
import { Decoration, EditorView, type DecorationSet } from '@codemirror/view';

export interface LineMarkers {
  readonly executing: number | null;
  readonly error: number | null;
}

export const setLineMarkers = StateEffect.define<LineMarkers>();

const executingLine = Decoration.line({ class: 'cm-executing-line' });
const errorLine = Decoration.line({ class: 'cm-error-line' });

/** Highlights the line being executed and the line of the last error. */
export const lineMarkersField: Extension = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, tr) {
    let next = decorations.map(tr.changes);
    for (const effect of tr.effects) {
      if (!effect.is(setLineMarkers)) continue;
      const ranges = [];
      const { executing, error } = effect.value;
      const doc = tr.state.doc;
      const valid = (n: number | null): n is number => n !== null && n >= 1 && n <= doc.lines;
      if (valid(error) && error !== executing) ranges.push(errorLine.range(doc.line(error).from));
      if (valid(executing)) ranges.push(executingLine.range(doc.line(executing).from));
      ranges.sort((a, b) => a.from - b.from);
      next = Decoration.set(ranges);
    }
    return next;
  },
  provide: (field) => EditorView.decorations.from(field),
});
