const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./apps/web/",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/apps/web/__tests__/setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapping: {
    "^@/(.*)": "<rootDir>/apps/web/$1",
    "^@ui": "<rootDir>/packages/ui/src/index.ts",
    "^@mad/db": "<rootDir>/packages/db/src/index.ts",
  },
};

module.exports = createJestConfig(customJestConfig);
