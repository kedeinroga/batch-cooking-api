import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },
  testMatch: ['**/*.spec.ts'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@batch-cooking/domain(.*)$':          '<rootDir>/libs/core/domain$1',
    '^@batch-cooking/domain-services(.*)$': '<rootDir>/libs/core/domain-services$1',
    '^@batch-cooking/use-cases(.*)$':       '<rootDir>/libs/core/use-cases$1',
    '^@batch-cooking/infrastructure(.*)$':  '<rootDir>/libs/infrastructure$1',
    '^@batch-cooking/shared(.*)$':          '<rootDir>/libs/shared$1',
  },
};

export default config;
