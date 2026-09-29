#!/usr/bin/env node
'use strict';
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const env = { ...process.env, SITE_ROOT: path.join(root, 'dist') };
const checks = [
  [process.execPath, ['scripts/build.cjs']],
  [process.execPath, ['scripts/test-build.cjs']],
  [process.env.PYTHON || 'python3', ['scripts/site_check.py']],
  [process.execPath, ['scripts/test-project-quotes.cjs']],
  [process.execPath, ['scripts/test-quick-request.cjs']],
  [process.execPath, ['scripts/test-form-core.cjs']]
];
for (const [command, args] of checks) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit' });
  if (result.error) { console.error(result.error.message); process.exit(1); }
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log('PASS: all offline website checks. No live form or analytics requests.');
