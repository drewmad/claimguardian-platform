import globals from "globals";
import tseslint from "typescript-eslint";
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const js = require("@eslint/js");



export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      globals: globals.node,
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: path.dirname(fileURLToPath(import.meta.url)),
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin
    },
    rules: {
      // Allow unused vars that start with underscore
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', args: 'none' }],
      // Allow any types for now since this is a UI library
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow empty interfaces for component props that extend HTML props
      '@typescript-eslint/no-empty-object-type': 'off',
      // Configure no-unused-expressions properly
      '@typescript-eslint/no-unused-expressions': ['error', { 
        allowShortCircuit: true,
        allowTernary: true,
        allowTaggedTemplates: true
      }],
      // Disable some strict rules for component library
      'no-undef': 'off', // TypeScript handles this
      'no-unused-vars': 'off', // Use TypeScript version instead
      'no-unused-expressions': 'off' // Use TypeScript version instead
    }
  }
];
