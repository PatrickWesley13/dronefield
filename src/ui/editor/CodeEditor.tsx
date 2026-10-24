import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { javascript, localCompletionSource } from '@codemirror/lang-javascript';
import { bracketMatching, indentOnInput, indentUnit } from '@codemirror/language';
import { Compartment, EditorState, type StateEffect } from '@codemirror/state';
import { EditorView, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers } from '@codemirror/view';
import { useEffect, useRef } from 'react';
import { gameCompletions, type CompletionScope } from './completions';
import { lineMarkersField, setLineMarkers } from './lineMarkers';
import { editorTheme } from './theme';

export interface CodeEditorProps {
  readonly documentId: string;
  readonly value: string;
  readonly readOnly: boolean;
  readonly executingLine: number | null;
  readonly errorLine: number | null;
  readonly completionScope: CompletionScope;
  readonly onChange: (value: string) => void;
  /** Requests to move the cursor to a line (e.g. from the console). Change the nonce to repeat. */
  readonly revealRequest: { readonly line: number; readonly nonce: number } | null;
  /** Text to insert at the cursor (e.g. from the Reference). Change the nonce to repeat. */
  readonly insertRequest: { readonly text: string; readonly nonce: number } | null;
}

/** CodeMirror 6 wrapped as a controlled-on-load React component. */
export function CodeEditor(props: CodeEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const readOnly = useRef(new Compartment());
  const latest = useRef(props);
  latest.current = props;

  useEffect(() => {
    const v = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: latest.current.value,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          history(),
          indentOnInput(),
          indentUnit.of('  '),
          bracketMatching(),
          closeBrackets(),
          javascript(),
          autocompletion({ override: [gameCompletions(() => latest.current.completionScope), localCompletionSource], icons: false }),
          keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, ...completionKeymap, indentWithTab]),
          lineMarkersField,
          readOnly.current.of(EditorState.readOnly.of(latest.current.readOnly)),
          editorTheme,
          EditorView.contentAttributes.of({ 'aria-label': 'Drone program (JavaScript)' }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) latest.current.onChange(u.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = v;
    return () => v.destroy();
  }, []);

  // Replace the document when switching levels or restoring starter code.
  useEffect(() => {
    const v = view.current;
    if (!v || v.state.doc.toString() === props.value) return;
    v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: props.value }, selection: { anchor: 0 } });
  }, [props.documentId, props.value]);

  useEffect(() => {
    view.current?.dispatch({ effects: readOnly.current.reconfigure(EditorState.readOnly.of(props.readOnly)) });
  }, [props.readOnly]);

  useEffect(() => {
    const v = view.current;
    if (!v) return;
    const effects: StateEffect<unknown>[] = [setLineMarkers.of({ executing: props.executingLine, error: props.errorLine })];
    const line = props.executingLine ?? props.errorLine;
    if (line && line <= v.state.doc.lines) effects.push(EditorView.scrollIntoView(v.state.doc.line(line).from, { y: 'nearest' }));
    v.dispatch({ effects });
  }, [props.executingLine, props.errorLine]);

  useEffect(() => {
    const v = view.current;
    const req = props.revealRequest;
    if (!v || !req || req.line > v.state.doc.lines) return;
    const pos = v.state.doc.line(req.line).from;
    v.dispatch({ selection: { anchor: pos }, effects: EditorView.scrollIntoView(pos, { y: 'center' }) });
    v.focus();
  }, [props.revealRequest]);

  useEffect(() => {
    const v = view.current;
    const req = props.insertRequest;
    if (!v || !req || latest.current.readOnly) return;
    const { from, to } = v.state.selection.main;
    const caret = req.text.endsWith('()') ? from + req.text.length - 1 : from + req.text.length;
    v.dispatch({ changes: { from, to, insert: req.text }, selection: { anchor: caret } });
    v.focus();
  }, [props.insertRequest]);

  return <div className="editor" ref={host} />;
}
