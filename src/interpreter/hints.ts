/** Friendly nudges for habits brought over from Python (or other languages). */
export const UNDEFINED_NAME_HINTS: Readonly<Record<string, string>> = {
  True: "In JavaScript it's true.",
  False: "In JavaScript it's false.",
  None: "In JavaScript it's null.",
  print: 'In JavaScript, write console.log(…).',
  len: 'Use .length, like list.length.',
  str: 'Use String(x) or a template string like `${x}`.',
  int: 'Use parseInt(x) or Math.floor(x).',
  range: 'range() is Python. Use a for loop: for (let i = 0; i < n; i++) { … }',
  append: 'Use list.push(item).',
  self: 'There is no self here. Use plain functions.',
  dict: 'Use an object literal like { wheat: 2 }.',
  list: 'Use an array literal like [1, 2, 3].',
};

/** Suggest a fix for a syntax error, based on the offending line. */
export function syntaxHint(lineText: string, message: string): string {
  if (/^\s*def\s/.test(lineText)) return 'JavaScript declares functions with function name() { … }.';
  if (/^\s*elif\b/.test(lineText)) return "In JavaScript it's else if (…) { … }.";
  if (/:\s*(#.*)?$/.test(lineText) && /^\s*(if|for|while|else|function)\b/.test(lineText))
    return 'JavaScript wraps blocks in { } instead of ending the line with a colon.';
  if (/^\s*#/.test(lineText)) return 'Comments start with // in JavaScript.';
  if (/\b(and|or|not)\b/.test(lineText.replace(/(["'`]).*?\1/g, ''))) return 'Use && for and, || for or, and ! for not.';
  if (/Unexpected token/.test(message) && /\bfor\s*\(?\s*\w+\s+in\s+range/.test(lineText)) return 'Try for (let i = 0; i < n; i++) { … }.';
  return '';
}

/** snake_case → camelCase, to suggest the game's naming. */
export function toCamelCase(name: string): string {
  return name.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}
