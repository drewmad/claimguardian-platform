module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.ts', '<rootDir>/e2e/**/*.e2e.ts'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  setupFilesAfterEnv: ['<rootDir>/e2e/setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      isolatedModules: true
    }]
  },
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results/e2e',
      outputName: 'junit.xml',
      suiteName: 'ClaimGuardian E2E Tests'
    }]
  ],
  collectCoverage: false,
  verbose: true
};