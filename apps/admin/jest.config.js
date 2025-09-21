const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@shared/auth$': '<rootDir>/../shared/auth/index',
    '^@shared/auth/(.*)$': '<rootDir>/../shared/auth/$1',
    '^ui-kit$': '<rootDir>/../../packages/ui-kit/src',
    '^ui-kit/(.*)$': '<rootDir>/../../packages/ui-kit/src/$1',
  },
  collectCoverageFrom: ['<rootDir>/**/*.{ts,tsx}'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
};

module.exports = createJestConfig(customJestConfig);
