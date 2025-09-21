import type { Config } from 'jest';

const config: Config = {
  collectCoverageFrom: ['components/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@shared/auth$': '<rootDir>/../shared/auth/index.ts',
    '^@shared/auth/(.*)$': '<rootDir>/../shared/auth/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.(test|spec).ts?(x)', '**/?(*.)+(test|spec).ts?(x)'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }]
  }
};

export default config;
