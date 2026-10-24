import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'test-results', 'playwright-report'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-restricted-syntax': [
        'error',
        { selector: "CallExpression[callee.name='eval']", message: 'Player code must never be evaluated natively.' },
      ],
      'no-new-func': 'error',
      'no-implied-eval': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  // Layering: inner layers must not depend on outer ones (see README "Architecture").
  layer('src/shared/**', [
    '@/domain/*',
    '@/interpreter',
    '@/interpreter/*',
    '@/api',
    '@/api/*',
    '@/missions',
    '@/missions/*',
    '@/progression',
    '@/progression/*',
    '@/persistence',
    '@/persistence/*',
    '@/runtime',
    '@/runtime/*',
    '@/app/*',
    '@/render/*',
    '@/audio/*',
    '@/ui/*',
  ]),
  layer('src/domain/**', [
    '@/interpreter',
    '@/interpreter/*',
    '@/api',
    '@/api/*',
    '@/missions',
    '@/missions/*',
    '@/progression',
    '@/progression/*',
    '@/persistence',
    '@/persistence/*',
    '@/runtime',
    '@/runtime/*',
    '@/app/*',
    '@/render/*',
    '@/audio/*',
    '@/ui/*',
  ]),
  layer('src/interpreter/**', [
    '@/domain/*',
    '@/api',
    '@/api/*',
    '@/missions',
    '@/missions/*',
    '@/progression',
    '@/progression/*',
    '@/persistence',
    '@/persistence/*',
    '@/runtime',
    '@/runtime/*',
    '@/app/*',
    '@/render/*',
    '@/audio/*',
    '@/ui/*',
  ]),
  layer('src/{api,missions,persistence}/**', [
    '@/progression',
    '@/progression/*',
    '@/runtime',
    '@/runtime/*',
    '@/app/*',
    '@/render/*',
    '@/audio/*',
    '@/ui/*',
  ]),
  layer('src/{progression,runtime}/**', ['@/app/*', '@/render/*', '@/audio/*', '@/ui/*']),
  layer('src/{render,audio,app}/**', ['@/ui/*']),
);

function layer(files, forbidden) {
  return {
    files: [files],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: forbidden, message: 'This import breaks the layering rules described in README.md.' }] },
      ],
    },
  };
}
