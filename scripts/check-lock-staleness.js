#!/usr/bin/env node
/**
 * CLI validation tool: check skills-lock.json staleness against current skills/ tree.
 * Usage: node scripts/check-lock-staleness.js [--skills-dir <path>] [--lock-file <path>]
 * Exit code 0 = up to date, 1 = stale or error.
 */
const fs = require('fs');
const path = require('path');
const { generateLockFile, verifyLockStaleness } = require('./lib/lockfile');

function main() {
  const args = process.argv.slice(2);
  const skillsDir = args.includes('--skills-dir')
    ? path.resolve(args[args.indexOf('--skills-dir') + 1])
    : path.resolve(__dirname, '..', 'skills');
  const lockPath = args.includes('--lock-file')
    ? path.resolve(args[args.indexOf('--lock-file') + 1])
    : path.resolve(__dirname, '..', 'skills-lock.json');

  if (!fs.existsSync(lockPath)) {
    console.error('ERROR: Lock file not found:', lockPath);
    process.exit(1);
  }

  const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  const result = verifyLockStaleness(skillsDir, lockData);

  if (result.stale) {
    console.error('STALE: skills-lock.json is out of date.');
    if (result.thresholdExceeded) console.error('  - Last extraction exceeds staleness threshold');
    if (result.missing.length) console.error('  - Missing skills:', result.missing.join(', '));
    if (result.extra.length) console.error('  - Extra skills in lock:', result.extra.join(', '));
    if (result.mismatches.length) {
      console.error('  - Hash mismatches:');
      for (const m of result.mismatches.slice(0, 10)) {
        console.error(`      ${m.skill}/${m.file}: expected ${m.expected.slice(0, 12)}... got ${m.actual.slice(0, 12)}...`);
      }
      if (result.mismatches.length > 10) {
        console.error(`      ... and ${result.mismatches.length - 10} more`);
      }
    }
    process.exit(1);
  }

  console.log('OK: skills-lock.json matches current skills/ tree');
  process.exit(0);
}

main();
