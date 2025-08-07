/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
        '**/*.test.ts',
        '**/*.test.tsx'
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@claimguardian/ui': path.resolve(__dirname, '../ui/src'),
      '@claimguardian/utils': path.resolve(__dirname, '../utils/src'),
      '@claimguardian/db': path.resolve(__dirname, '../db/src'),
      '@claimguardian/ai-services': path.resolve(__dirname, '../ai-services/src')
    }
  }
})
