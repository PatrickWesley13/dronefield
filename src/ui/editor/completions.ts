import {
  snippetCompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
  type CompletionSource,
} from '@codemirror/autocomplete';
import { DRONE_API } from '@/api';
import type { CropId } from '@/domain/crops';
import { DIRECTIONS } from '@/domain/geometry';
import { STANDARD_GLOBALS, STANDARD_MEMBERS } from '@/interpreter';

export interface CompletionScope {
  readonly unlockedFunctions: ReadonlySet<string>;
  readonly unlockedCrops: readonly CropId[];
}

const VALUE_MEMBERS = new Set(['PI', 'MAX_SAFE_INTEGER']);
const KEYWORDS = [
  'function',
  'while',
  'for',
  'const',
  'let',
  'if',
  'else',
  'return',
  'break',
  'continue',
  'true',
  'false',
  'null',
  'undefined',
  'switch',
  'typeof',
];

/** Completions for the drone API, JS built-ins and their members, crops and directions. */
export function gameCompletions(getScope: () => CompletionScope): CompletionSource {
  return (ctx: CompletionContext): CompletionResult | null => {
    const scope = getScope();
    const inString = ctx.matchBefore(/"[a-z]*/);
    if (inString) {
      const options: Completion[] = [
        ...scope.unlockedCrops.map((c) => ({ label: `"${c}"`, type: 'enum', detail: 'crop' })),
        ...DIRECTIONS.map((d) => ({ label: `"${d}"`, type: 'enum', detail: 'direction' })),
      ];
      return { from: inString.from, options, validFor: /^"[a-z]*$/ };
    }
    const member = ctx.matchBefore(/[A-Za-z_$][\w$]*\.[\w$]*/);
    if (member) {
      const [object = ''] = member.text.split('.');
      const members = STANDARD_MEMBERS[object];
      if (!members) return null;
      return {
        from: member.from + object.length + 1,
        options: members.map((m) =>
          VALUE_MEMBERS.has(m)
            ? { label: m, type: 'constant' }
            : snippetCompletion(`${m}(\${})`, { label: m, type: 'method', detail: `${object}.${m}()` }),
        ),
        validFor: /^[\w$]*$/,
      };
    }
    const word = ctx.matchBefore(/[A-Za-z_$][\w$]*/);
    if (!word && !ctx.explicit) return null;
    const options: Completion[] = [
      ...DRONE_API.filter((f) => scope.unlockedFunctions.has(f.name)).map((f) =>
        snippetCompletion(f.maxArgs > 0 ? `${f.name}(\${})` : `${f.name}()`, {
          label: f.name,
          type: 'function',
          detail: f.signature.replace(/^\w+/, ''),
          info: f.description,
          boost: 2,
        }),
      ),
      ...STANDARD_GLOBALS.map((g) => ({ label: g, type: STANDARD_MEMBERS[g] ? 'namespace' : 'function', boost: 1 })),
      ...KEYWORDS.map((k) => ({ label: k, type: 'keyword' })),
    ];
    return { from: word?.from ?? ctx.pos, options, validFor: /^[\w$]*$/ };
  };
}
