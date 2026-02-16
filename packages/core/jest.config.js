module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testPathIgnorePatterns: ['/node_modules/', 'test-helpers\\.ts$'],
  moduleNameMapper: {
    '^@darkly/core/(.*)$': '<rootDir>/src/$1',
  },
  globals: {
    __DEV_MODE__: false,
    __PRODUCT_ID__: 'gmail',
  },
};
