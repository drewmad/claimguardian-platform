// Progressive ESLint configuration for gradual improvement
module.exports = {
  extends: ['./.eslintrc.js'],
  rules: {
    // Phase 1: Convert errors to warnings for gradual fixes
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true
    }],
    
    // Phase 2: Auto-fixable rules (keep as errors)
    'react/no-unescaped-entities': 'error',
    'import/order': ['error', {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always'
    }],
    
    // Phase 3: Temporarily relaxed rules
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    
    // Phase 4: Rules to enable gradually
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error'
  },
  
  overrides: [
    {
      // Stricter rules for new files
      files: ['**/new-*.{ts,tsx}', '**/refactored-*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unused-vars': 'error'
      }
    },
    {
      // Relaxed rules for legacy files (gradually tighten)
      files: ['src/scripts/**/*.ts', 'src/lib/services/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'warn'
      }
    }
  ]
};