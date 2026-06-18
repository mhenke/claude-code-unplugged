/**
 * Lock file generation for skills extraction staleness tracking.
 * Computes SHA-256 hashes of ALL tracked files per skill directory and generates
 * a v2 skills-lock.json with per-skill file hashes for staleness verification.
 * Provenance (sourceCommit, sourceRepository) lives in skills-lock.json.
 * Also provides staleness verification against the current skills tree.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/** File patterns to include in hashing (glob-like, but simple suffix match) */
const TRACKED_PATTERNS = [
  'SKILL.md',
  'scripts/',
  'examples/',
  'references/',
  'manifest.json',
  '.claude-plugin/',
];

/**
 * Determine whether a file within a skill directory should be tracked.
 * @param {string} relativePath - Path relative to skill directory
 * @returns {boolean}
 */
function isTrackedFile(relativePath) {
  return TRACKED_PATTERNS.some(p => {
    if (p.endsWith('/')) {
      return relativePath.startsWith(p) || relativePath === p.slice(0, -1);
    }
    return relativePath === p;
  });
}

/**
 * Recursively list all files in a directory (relative paths).
 * @param {string} dirPath
 * @param {string} [prefix='']
 * @returns {string[]}
 */
function listFilesRecursive(dirPath, prefix = '') {
  const results = [];
  if (!fs.existsSync(dirPath)) return results;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(fullPath, relPath));
    } else {
      results.push(relPath);
    }
  }
  return results;
}

/**
 * Compute SHA-256 hash of a file's contents.
 * @param {string} filePath
 * @returns {string} hex digest
 */
function computeHash(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Generate the full lock file object, hashing ALL tracked files per skill.
 * @param {string} skillsDir - Path to the skills directory
 * @param {object} metadata - { stalenessThresholdDays?, commit?, repository? }
 * @returns {object} lock file content
 */
function generateLockFile(skillsDir, metadata = {}) {
  const skills = {};
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .filter(d => fs.existsSync(path.join(skillsDir, d.name, 'SKILL.md')));

  for (const entry of entries) {
    const skillDir = path.join(skillsDir, entry.name);
    const files = listFilesRecursive(skillDir)
      .filter(f => isTrackedFile(f));

    const fileHashes = {};
    for (const relPath of files) {
      fileHashes[relPath] = computeHash(path.join(skillDir, relPath));
    }

    skills[entry.name] = {
      fileHashes,
      combinedHash: crypto.createHash('sha256')
        .update(
          Object.entries(fileHashes)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v}`)
            .join('\n'),
          'utf8'
        )
        .digest('hex'),
    };
  }

  const generated = {
    stalenessThresholdDays: metadata.stalenessThresholdDays || 30,
  };
  if (metadata.commit) generated.sourceCommit = metadata.commit;
  if (metadata.repository) generated.sourceRepository = metadata.repository;

  return {
    version: 2,
    generated,
    skills,
  };
}

/**
 * Verify a lock file against the current skills tree.
 * Returns detailed staleness report.
 * @param {string} skillsDir - Path to the skills directory
 * @param {object} lockData - Parsed skills-lock.json content
 * @returns {{ stale: boolean, mismatches: Array<{skill: string, file: string, expected: string, actual: string}>, missing: string[], extra: string[], thresholdExceeded: boolean }}
 */
function verifyLockStaleness(skillsDir, lockData) {
  const result = {
    stale: false,
    mismatches: [],
    missing: [],
    extra: [],
    thresholdExceeded: false,
  };

  // Check staleness threshold
  if (lockData.generated && lockData.generated.lastExtracted) {
    const extracted = new Date(lockData.generated.lastExtracted);
    const now = new Date();
    const thresholdDays = lockData.generated.stalenessThresholdDays || 30;
    const ageDays = (now - extracted) / (1000 * 60 * 60 * 24);
    if (ageDays > thresholdDays) {
      result.thresholdExceeded = true;
      result.stale = true;
    }
  }

  // Get current skill entries
  const current = generateLockFile(skillsDir, lockData.generated || {});

  // Check for missing skills
  for (const skillName of Object.keys(current.skills)) {
    if (!lockData.skills[skillName]) {
      result.missing.push(skillName);
      result.stale = true;
    }
  }

  // Check for extra skills (in lock but not on disk)
  for (const skillName of Object.keys(lockData.skills)) {
    if (!current.skills[skillName]) {
      result.extra.push(skillName);
      result.stale = true;
    }
  }

  // Check hash mismatches per skill
  for (const skillName of Object.keys(current.skills)) {
    if (!lockData.skills[skillName]) continue;
    const locked = lockData.skills[skillName];
    const curr = current.skills[skillName];

    // Compare combined hashes
    if (locked.combinedHash !== curr.combinedHash) {
      result.stale = true;
    }

    // Per-file hash comparison for detailed reporting
    const lockedFiles = locked.fileHashes || {};
    const currFiles = curr.fileHashes || {};

    for (const [filePath, currHash] of Object.entries(currFiles)) {
      if (lockedFiles[filePath] === undefined) {
        result.mismatches.push({
          skill: skillName,
          file: filePath,
          expected: '(missing)',
          actual: currHash,
        });
      } else if (lockedFiles[filePath] !== currHash) {
        result.mismatches.push({
          skill: skillName,
          file: filePath,
          expected: lockedFiles[filePath],
          actual: currHash,
        });
      }
    }

    for (const filePath of Object.keys(lockedFiles)) {
      if (currFiles[filePath] === undefined) {
        result.mismatches.push({
          skill: skillName,
          file: filePath,
          expected: lockedFiles[filePath],
          actual: '(removed)',
        });
      }
    }
  }

  return result;
}

module.exports = { computeHash, generateLockFile, verifyLockStaleness, isTrackedFile, listFilesRecursive };
