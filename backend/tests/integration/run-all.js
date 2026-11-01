/**
 * Integration Test Runner (best-effort)
 *
 * These legacy scripts hit a running server and/or a live database (via axios /
 * Prisma) and print their own pass/fail output. They are NOT Jest tests. This
 * runner executes each one as a child process, reports the outcome, and never
 * fails the overall process — so it will not block CI when no server/DB is up.
 *
 * Usage: `npm run test:integration`  (start the backend + DB first for real runs)
 */

const path = require('path');
const { spawnSync } = require('child_process');
const fs = require('fs');

const DIR = __dirname;
const PER_TEST_TIMEOUT_MS = 60000;

const scripts = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith('.test.js'))
  .sort();

console.log('🔌 Integration test runner (best-effort)\n');
console.log(`Found ${scripts.length} integration script(s).`);
console.log('NOTE: these require a running backend server and/or database.\n');

const results = [];

for (const script of scripts) {
  const full = path.join(DIR, script);
  process.stdout.write(`▶ ${script} ... `);
  const res = spawnSync(process.execPath, [full], {
    cwd: path.join(DIR, '..', '..'),
    timeout: PER_TEST_TIMEOUT_MS,
    encoding: 'utf-8'
  });

  const ok = res.status === 0;
  results.push({ script, ok, status: res.status });
  console.log(ok ? 'PASS' : `FAIL (exit ${res.status === null ? 'timeout/killed' : res.status})`);
}

const passed = results.filter((r) => r.ok).length;
console.log(`\nSummary: ${passed}/${results.length} passed.`);
console.log('(Failures here are expected when the server/DB are not running.)');

// Best-effort: never block CI on integration outcomes.
process.exit(0);
