/*
 * @fileMetadata
 * @purpose ESLint configuration for the utility package.
 * @owner frontend-team
 * @lastModifiedBy Drew Madison
 * @lastModifiedDate 2025-07-03T21:08:02-04:00
 * @status active
 * @notes Defines linting rules specific to utility functions, allowing any types for flexibility.
 */
import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      ...typescript.configs.recommended.rules,
      // Allow unused vars that start with underscore
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Allow any types for utility functions
      '@typescript-eslint/no-explicit-any': 'off',
      // Disable some strict rules for utility library
      'no-undef': 'off' // TypeScript handles this
    }
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'module'
    }
  }
]