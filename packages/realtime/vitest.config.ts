import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['../../test-setup-jsdom.ts'],
    globals: true
  },
  resolve: {
    alias: {
      '@claimguardian/db': resolve(__dirname, '../../packages/db/src'),
      '@claimguardian/utils': resolve(__dirname, '../../packages/utils/src'),
      '@claimguardian/ui': resolve(__dirname, '../../packages/ui/src')
    }
  }
})