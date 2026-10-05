import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['**/node_modules/**', '**/.next/**', '**/dist/**', 'ai_resume_builder/**', 'legacy/**'] },
  js.configs.recommended,
  { files: ['app/**/*.{js,jsx}', 'src/**/*.{js,jsx}'],
    ...reactHooks.configs.flat.recommended,
    languageOptions: { globals: globals.browser, parserOptions: { ecmaFeatures: { jsx: true } } },
  },
  { files: ['server/**/*.mjs', 'tests/**/*.mjs', '**/*.config.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];
