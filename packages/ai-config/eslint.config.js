import globals from "globals";
import tseslint from "typescript-eslint";
import js from "@eslint/js";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // Allow unused vars that start with underscore
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Allow any types for now since this is a UI library
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow empty interfaces for component props that extend HTML props
      '@typescript-eslint/no-empty-object-type': 'off',
      // Disable some strict rules for component library
      'no-undef': 'off' // TypeScript handles this
    }
  }
];
