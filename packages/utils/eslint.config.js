/*
 * @fileMetadata
 * @purpose "ESLint configuration for the utility package."
 * @owner frontend-team
 * @lastModifiedBy Drew Madison
 * @lastModifiedDate 2025-07-03T21:08:02-04:00
 * @status stable
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
      // Base TypeScript rules without extending the full config to avoid conflicts
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        // Allow unused parameters that become class properties
        args: 'none'
      }],
      // Disable the regular no-unused-vars rule in favor of TypeScript version
      'no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': ['error', {
        allowShortCircuit: true,
        allowTernary: true,
        allowTaggedTemplates: true
      }],
      // Disable some strict rules for utility library
      'no-undef': 'off', // TypeScript handles this
      'no-unused-expressions': 'off' // Use TypeScript version instead
    }
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'module'
    },
    rules: {
      'no-unused-expressions': ['error', {
        allowShortCircuit: true,
        allowTernary: true,
        allowTaggedTemplates: true
      }]
    }
  }
]
