import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const config = {
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts', '<rootDir>/jest-setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@ui$': '<rootDir>/../../packages/ui/src/index.ts',
    '^@claimguardian/ui$': '<rootDir>/../../packages/ui/src/index.ts',
    '^@claimguardian/utils$': '<rootDir>/../../packages/utils/src/index.ts',
    '^@claimguardian/db$': '<rootDir>/../../packages/db/src/index.ts',
  },
  testMatch: [
    '<rootDir>/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '<rootDir>/src/**/*.(test|spec).(js|jsx|ts|tsx)',
  ],
  collectCoverageFrom: [
    'src/**/*.(js|jsx|ts|tsx)',
    '!src/**/*.d.ts',
    '!src/**/*.stories.(js|jsx|ts|tsx)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
}

export default createJestConfig(config)