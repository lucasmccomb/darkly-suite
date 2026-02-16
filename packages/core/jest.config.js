module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@darkly/core/(.*)$': '<rootDir>/src/$1',
  },
};
