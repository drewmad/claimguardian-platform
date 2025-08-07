/**
 * @fileMetadata
 * @purpose Root Vitest configuration for monorepo test coverage
 * @owner test-team
 * @dependencies ["vitest", "@vitest/coverage-v8"]
 * @exports ["default"]
 * @complexity medium
 * @tags ["test", "config", "coverage", "monorepo"]
 * @status active
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-04T21:00:00Z
 */

import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    projects: [
      // Node.js environment for server actions, AI services, utilities
      {
        test: {
          name: 'node',
          environment: 'node',
          include: [
            'packages/utils/src/**/*.{test,spec}.{js,ts}',
            'packages/ai-services/src/**/*.{test,spec}.{js,ts}',
            'packages/db/src/**/*.{test,spec}.{js,ts}',
            'packages/monitoring/src/**/*.{test,spec}.{js,ts}',
            'apps/web/src/actions/**/*.{test,spec}.{js,ts}'
          ],
          setupFiles: ['./test-setup.ts']
        }
      },
      // JSDOM environment for React components
      {
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: [
            'packages/ui/src/**/*.{test,spec}.{js,ts,tsx}',
            'packages/realtime/src/**/*.{test,spec}.{js,ts,tsx}',
            'apps/web/src/components/**/*.{test,spec}.{js,ts,tsx}',
            'apps/web/src/app/**/*.{test,spec}.{js,ts,tsx}'
          ],
          setupFiles: ['./test-setup-jsdom.ts']
        }
      }
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        '*.config.*',
        'coverage/**',
        '.next/**',
        '.turbo/**',
        'supabase/functions/tests/**',
        '**/*.d.ts',
        '**/*.test.*',
        '**/*.spec.*'
      ],
      include: [
        'packages/*/src/**/*.{ts,tsx}',
        'apps/*/src/**/*.{ts,tsx}',
        '!apps/*/src/**/*.test.*',
        '!apps/*/src/**/*.spec.*'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    // Test timeout for complex operations
    testTimeout: 10000,
    // Retry failed tests once
    retry: 1
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './apps/web/src'),
      '@claimguardian/ui': resolve(__dirname, './packages/ui/src'),
      '@claimguardian/utils': resolve(__dirname, './packages/utils/src'),
      '@claimguardian/db': resolve(__dirname, './packages/db/src'),
      '@claimguardian/ai-services': resolve(__dirname, './packages/ai-services/src'),
      '@claimguardian/realtime': resolve(__dirname, './packages/realtime/src'),
      '@claimguardian/monitoring': resolve(__dirname, './packages/monitoring/src')
    }
  }
})
