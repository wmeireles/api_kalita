module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/server.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^jose$': '<rootDir>/src/__tests__/__mocks__/jose.js',
    '^jsdom$': '<rootDir>/src/__tests__/__mocks__/jsdom.js',
    '^dompurify$': '<rootDir>/src/__tests__/__mocks__/dompurify.js',
  },
};
