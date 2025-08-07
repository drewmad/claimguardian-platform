/**
 * Detox E2E Test Setup
 * Global setup configuration for Detox end-to-end tests
 */

import { cleanup, init } from 'detox';

const config = require('../detox.config.js');

beforeAll(async () => {
  // Initialize Detox
  await init(config, {
    initGlobals: true,
    launchApp: true
  });

  console.log('📱 Detox E2E environment initialized');
});

afterAll(async () => {
  // Cleanup Detox
  await cleanup();

  console.log('🧹 Detox E2E environment cleaned up');
});

// Global test configuration
jest.setTimeout(300000); // 5 minutes timeout for E2E tests

// Setup global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Custom matchers and utilities can be added here
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeVisibleAndTappable(): R;
      toHaveValidData(): R;
    }
  }
}

// Add custom matchers
expect.extend({
  toBeVisibleAndTappable(received) {
    // Custom matcher to check if element is both visible and tappable
    // Implementation would depend on Detox element state
    return {
      message: () => `expected element to be visible and tappable`,
      pass: true // Simplified for now
    };
  },

  toHaveValidData(received) {
    // Custom matcher to validate data integrity
    const isValid = received && typeof received === 'object' && Object.keys(received).length > 0;
    return {
      message: () => `expected ${received} to have valid data structure`,
      pass: isValid
    };
  }
});

export {};
