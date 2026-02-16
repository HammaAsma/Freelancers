export default {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  setupFilesAfterEnv: ['./src/test/setup.js'],
  testTimeout: 30000,
  moduleFileExtensions: ['js', 'json', 'node'],
  transform: {},
  transformIgnorePatterns: [],
  verbose: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/test/**',
    '!src/**/*.test.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};