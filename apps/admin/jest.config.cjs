const path = require('path');

module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/dist-tests/apps/admin/components/status/__tests__/**/*.test.js',
    '<rootDir>/dist-tests/apps/admin/lib/__tests__/**/*.test.js'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/dist-tests/apps/admin/$1',
    '^ui-kit/status$': '<rootDir>/tests/runtime/ui-kit-status.js',
    '^@shared/api/(.*)$': '<rootDir>/dist-tests/apps/shared/api/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/runtime/jest-setup.js'],
  transform: {}
};
