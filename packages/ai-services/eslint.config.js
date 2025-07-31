import globals from "globals";
import tseslint from "typescript-eslint";
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const js = require("@eslint/js");

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: path.dirname(fileURLToPath(import.meta.url)),
      },
    },
    rules: {
      // Allow unused vars that start with underscore
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Allow any types for now since this is a service library
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow empty interfaces for service interfaces
      '@typescript-eslint/no-empty-object-type': 'off',
      // Disable some strict rules for service library
      'no-undef': 'off' // TypeScript handles this
    }
  }
];