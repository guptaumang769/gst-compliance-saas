/**
 * Jest configuration.
 *
 * Only DB-free, pure unit tests under tests/unit/** are run by `npm test`.
 * The legacy server-hitting scripts live under tests/integration/** and are
 * executed by the best-effort runner (`npm run test:integration`), NOT by Jest.
 */

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/unit/**/*.test.js'],
  // Never let Jest pick up the integration scripts (they need a live server/DB).
  testPathIgnorePatterns: ['/node_modules/', '/tests/integration/'],
  clearMocks: true,
  verbose: true
};
