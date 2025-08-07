/**
 * @fileMetadata
 * @purpose "Vitest configuration for utils package testing"
 * @owner test-team
 * @dependencies ["vitest"]
 * @exports ["default"]
 * @complexity low
 * @tags ["test", "config", "vitest"]
 * @status stable
 * @lastModifiedBy Claude AI Assistant
 * @lastModifiedDate 2025-08-04T20:25:00Z
 */

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}']
  }
})
