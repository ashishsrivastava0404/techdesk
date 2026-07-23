export default {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['js', 'mjs'],
  testMatch: ['**/tests/**/*.test.js', '**/__tests__/**/*.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/db/index.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true
};
