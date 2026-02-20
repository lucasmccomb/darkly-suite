module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/functions'],
  testPathIgnorePatterns: ['/node_modules/', 'test-helpers\\.ts$', '/fixtures/'],
  moduleNameMapper: {
    // Source files use .ts extension imports (e.g., import { Env } from '../_shared/types.ts')
    // Strip the .ts so ts-jest can resolve them
    '^(\\.\\.?/.*)\\.ts$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
};
