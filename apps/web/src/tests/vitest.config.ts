/**
 * Vitest Configuration for Vector Tiles Tests
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['src/tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../'),
    },
  },
  define: {
    // Define environment variables for tests
    'process.env.NODE_ENV': JSON.stringify('test'),
    'process.env.DATABASE_URL': JSON.stringify('postgresql://test:test@localhost:5432/test'),
    'process.env.MVT_VERSION_SIG': JSON.stringify('test@v1'),
    'process.env.MVT_DEFAULT_TTL_SECONDS': JSON.stringify('3600'),
    'process.env.MVT_ACTIVE_TTL_SECONDS': JSON.stringify('600'),
  },
});