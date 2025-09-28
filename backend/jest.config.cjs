/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/backend'],
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  transform: {},        // JS only (no ts-jest)
  clearMocks: true,
  verbose: true
};



