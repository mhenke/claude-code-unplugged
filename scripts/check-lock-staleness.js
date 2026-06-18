#!/usr/bin/env node

/**
 * skills-lock.json staleness checker.
 * Verifies that tracked files in skills/ match the hashes recorded in skills-lock.json.
 * Exits 0 if fresh, 1 if stale (with detailed report).
 */

const fs = require('fs');
const path = require('path');
const { verifyLockStaleness } = require('./lib/lockfile');

// Parse CLI args for --skills-dir and --lock-file overrides
const args = process.argv.slice(2);
let skillsDir = process.env.SKILLS_DIR || path.resolve(__dirname, '../skills');
let lockPath = path.resolve(__dirname, '../skills-lock.json');

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--skills-dir') {
    skillsDir = path.resolve(args[++i]);
  } else if (args[i] === '--lock-file') {
    lockPath = path.resolve(args[++i]);
  }
}

if (!fs.existsSync(lockPath)) {
  console.error('ERROR: skills-lock.json not found. Run the extraction pipeline first.');
  process.exit(1);
}

const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
const result = verifyLockStaleness(skillsDir, lockData);

let exitCode = 0;

if (result.mismatches.length > 0) {
  console.error('Hash mismatches detected (skills tree modified since last extraction):');
  for (const m of result.mismatches) {
    console.error(`  [${m.skill}] ${m.file}: expected ${m.expected.slice(0, 12)}…, actual ${m.actual.slice(0, 12)}…`);
  }
  exitCode = 1;
}

if (result.missing.length > 0) {
  console.error('New skills not in lockfile:', result.missing.join(', '));
  exitCode = 1;
}

if (result.extra.length > 0) {
  console.error('Skills in lockfile but missing from disk:', result.extra.join(', '));
  exitCode = 1;
}

if (result.thresholdExceeded) {
  console.error('STALE: Last extraction exceeds staleness threshold.');
  exitCode = 1;
}

if (exitCode === 0) {
  const skillCount = Object.keys(lockData.skills).length;
  console.log(`OK: skills-lock.json is fresh (${skillCount} skills, all hashes match).`);
} else {
  // Ensure at least one "STALE" marker in stderr for test detection
  if (!result.thresholdExceeded) {
    console.error('STALE: skills tree does not match lockfile.');
  }
}

process.exit(exitCode);
