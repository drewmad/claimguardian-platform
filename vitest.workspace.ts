/// <reference types="vitest" />
import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  // Web app config
  {
    test: {
      name: 'web',
      root: 'apps/web',
      environment: 'jsdom',
      setupFiles: ['./test-setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          '.next/',
          'coverage/',
          '**/*.d.ts',
          '**/*.config.*',
          'test-setup.ts'
        ]
      }
    }
  },

  // Shared packages config
  {
    test: {
      name: 'packages',
      root: 'packages',
      environment: 'node',
      include: ['**/src/**/*.{test,spec}.{js,ts}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json']
      }
    }
  },

  // Services config
  {
    test: {
      name: 'services',
      root: 'services',
      environment: 'node',
      include: ['**/src/**/*.{test,spec}.{js,ts}'],
      coverage: {
        provider: 'v8'
      }
    }
  }
]);