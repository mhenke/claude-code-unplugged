const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execSync } = require('node:child_process');

const TMP_DIR = path.join(os.tmpdir(), 'ccu-test-extract-' + crypto.randomUUID());
const EXTRACT_SCRIPT = path.resolve(__dirname, '../extract.js');
const CHECK_LOCK_SCRIPT = path.resolve(__dirname, '../check-lock-staleness.js');
const VALIDATE_SCRIPT = path.resolve(__dirname, '../validate.js');
const { generateLockFile, verifyLockStaleness } = require('../lib/lockfile');

function cleanTmpDir() {
  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

// ============================================================
// Integration tests: extract.js CLI
// ============================================================
describe('extract.js CLI integration', () => {
  let sourceDir;
  let targetDir;

  before(() => {
    cleanTmpDir();
    sourceDir = path.join(TMP_DIR, 'mock-source');
    targetDir = path.join(TMP_DIR, 'mock-target');
    fs.mkdirSync(sourceDir, { recursive: true });
    fs.mkdirSync(targetDir, { recursive: true });
  });

  after(() => {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it('exits with error when no args provided', () => {
    try {
      execSync(`node "${EXTRACT_SCRIPT}"`, { stdio: 'pipe' });
      assert.fail('Should have exited with code 1');
    } catch (e) {
      assert.strictEqual(e.status, 1);
    }
  });

  it('prints usage with --help', () => {
    const result = execSync(`node "${EXTRACT_SCRIPT}" --help`, { stdio: 'pipe' });
    assert.match(result.toString(), /Usage:/);
  });

  it('exits with error when source does not exist', () => {
    try {
      execSync(`node "${EXTRACT_SCRIPT}" --source /nonexistent/path --target ${targetDir}`, { stdio: 'pipe' });
      assert.fail('Should have exited with code 1');
    } catch (e) {
      assert.strictEqual(e.status, 1);
    }
  });

  it('exits with error when source is not a directory', () => {
    const filePath = path.join(TMP_DIR, 'not-a-dir.txt');
    fs.writeFileSync(filePath, 'not a directory', 'utf8');
    try {
      execSync(`node "${EXTRACT_SCRIPT}" --source ${filePath} --target ${targetDir}`, { stdio: 'pipe' });
      assert.fail('Should have exited with code 1');
    } catch (e) {
      assert.strictEqual(e.status, 1);
    }
  });

  it('extracts skills from mock source with direct skills', () => {
    const mockPluginsDir = path.join(sourceDir, 'plugins');
    fs.mkdirSync(path.join(mockPluginsDir, 'my-plugin', 'skills', 'my-skill'), { recursive: true });
    fs.writeFileSync(
      path.join(mockPluginsDir, 'my-plugin', 'skills', 'my-skill', 'SKILL.md'),
      '---\nname: my-skill\ndescription: A test skill extracted from Claude Code\nversion: 9.9.9\nlicense: Source license\n---\n\n# My Skill\n\nBody content.',
      'utf8'
    );

    const result = execSync(`node "${EXTRACT_SCRIPT}" --source ${sourceDir} --target ${targetDir}`, { stdio: 'pipe' });
    const output = result.toString();
    assert.match(output, /Copying direct skill: my-skill/);
    assert.match(output, /Extraction completed successfully/);

    const destSkillMd = path.join(targetDir, 'skills', 'my-skill', 'SKILL.md');
    assert.ok(fs.existsSync(destSkillMd));
    const content = fs.readFileSync(destSkillMd, 'utf8');
    assert.ok(!content.includes('Claude Code'));
    assert.ok(content.includes('coding assistant'));
    assert.ok(!content.includes('version:'));
    assert.ok(!content.includes('license:'));
  });

  it('merges commands for known plugin configs', () => {
    const pluginDir = path.join(sourceDir, 'plugins', 'commit-commands');
    fs.mkdirSync(path.join(pluginDir, 'commands'), { recursive: true });
    fs.writeFileSync(
      path.join(pluginDir, 'commands', 'commit.md'),
      '---\ndescription: Commit changes\n---\n\nRun `git commit`.',
      'utf8'
    );
    fs.writeFileSync(
      path.join(pluginDir, 'commands', 'push.md'),
      '---\ndescription: Push changes\n---\n\nRun `git push`.',
      'utf8'
    );

    execSync(`node "${EXTRACT_SCRIPT}" --source ${sourceDir} --target ${targetDir}`, { stdio: 'pipe' });

    const destSkillMd = path.join(targetDir, 'skills', 'commit-commands', 'SKILL.md');
    assert.ok(fs.existsSync(destSkillMd));
    const content = fs.readFileSync(destSkillMd, 'utf8');
    assert.ok(content.includes('Commands / Workflows'));
    assert.ok(content.includes('commit'));
    assert.ok(content.includes('push'));
    assert.ok(!content.includes('version:'));
  });

  it('handles empty source gracefully', () => {
    const emptySourceDir = path.join(TMP_DIR, 'empty-source');
    fs.mkdirSync(emptySourceDir, { recursive: true });
    const emptyTargetDir = path.join(TMP_DIR, 'empty-target');
    fs.mkdirSync(emptyTargetDir, { recursive: true });

    const result = execSync(`node "${EXTRACT_SCRIPT}" --source ${emptySourceDir} --target ${emptyTargetDir}`, { stdio: 'pipe' });
    const output = result.toString();
    assert.match(output, /Extraction completed successfully/);
  });

  it('skips missing plugin dirs gracefully', () => {
    const result = execSync(`node "${EXTRACT_SCRIPT}" --source ${sourceDir} --target ${targetDir}`, { stdio: 'pipe' });
    const output = result.toString();
    assert.match(output, /Extraction completed successfully/);
  });
});

// ============================================================
// Lock file module tests: generateLockFile + verifyLockStaleness
// ============================================================
describe('lockfile.js generateLockFile + verifyLockStaleness', () => {
  let lockSkillsDir;
  let lockDir;

  before(() => {
    lockDir = path.join(TMP_DIR, 'lock-test');
    lockSkillsDir = path.join(lockDir, 'skills');
    fs.mkdirSync(lockSkillsDir, { recursive: true });
  });

  after(() => {
    fs.rmSync(lockDir, { recursive: true, force: true });
  });

  function mkSkill(skillName, files) {
    const dir = path.join(lockSkillsDir, skillName);
    fs.mkdirSync(dir, { recursive: true });
    for (const [relPath, content] of Object.entries(files)) {
      const fdir = path.dirname(path.join(dir, relPath));
      fs.mkdirSync(fdir, { recursive: true });
      fs.writeFileSync(path.join(dir, relPath), content, 'utf8');
    }
  }

  it('generates lock file with correct version, staleness config, and per-skill hashes', () => {
    mkSkill('test-a', { 'SKILL.md': '# Skill A\n\nbody' });
    mkSkill('test-b', { 'SKILL.md': '# Skill B\n\nbody' });

    const lock = generateLockFile(lockSkillsDir, {
      stalenessThresholdDays: 30,
    });

    assert.strictEqual(lock.version, 2);
    assert.ok(lock.generated.lastExtracted);
    assert.strictEqual(lock.generated.stalenessThresholdDays, 30);
    // Provenance (sourceCommit, sourceRepository) lives in skills.json only
    assert.strictEqual(lock.generated.sourceCommit, undefined);
    assert.strictEqual(lock.generated.sourceRepository, undefined);
    assert.ok(lock.skills['test-a']);
    assert.ok(lock.skills['test-b']);
    assert.ok(lock.skills['test-a'].combinedHash);
    assert.ok(lock.skills['test-a'].fileHashes['SKILL.md']);
  });

  it('tracks scripts/ and examples/ subdirectories', () => {
    mkSkill('multi-artifact', {
      'SKILL.md': '# Multi\n\nbody',
      'scripts/build.sh': '#!/bin/bash\necho build',
      'examples/usage.txt': 'Example usage',
      'references/notes.md': '# Notes',
    });

    const lock = generateLockFile(lockSkillsDir, {});
    const skill = lock.skills['multi-artifact'];
    assert.ok(skill.fileHashes['SKILL.md']);
    assert.ok(skill.fileHashes['scripts/build.sh']);
    assert.ok(skill.fileHashes['examples/usage.txt']);
    assert.ok(skill.fileHashes['references/notes.md']);
  });

  it('validate returns no staleness for matching lock', () => {
    const lock = generateLockFile(lockSkillsDir, { stalenessThresholdDays: 30 });
    const result = verifyLockStaleness(lockSkillsDir, lock);
    assert.strictEqual(result.stale, false);
    assert.deepStrictEqual(result.mismatches, []);
    assert.deepStrictEqual(result.missing, []);
    assert.deepStrictEqual(result.extra, []);
    assert.strictEqual(result.thresholdExceeded, false);
  });

  it('detects changed SKILL.md content as stale', () => {
    mkSkill('change-detection', {
      'SKILL.md': '# Original\n\nbody',
    });

    const lock = generateLockFile(lockSkillsDir, {});
    // Now change the file
    fs.writeFileSync(path.join(lockSkillsDir, 'change-detection', 'SKILL.md'), '# Changed\n\nbody', 'utf8');

    const result = verifyLockStaleness(lockSkillsDir, lock);
    assert.strictEqual(result.stale, true);
    assert.ok(result.mismatches.length > 0);
    const mm = result.mismatches.find(m => m.skill === 'change-detection' && m.file === 'SKILL.md');
    assert.ok(mm, 'Expected SKILL.md mismatch for change-detection');
  });

  it('detects added/removed skills as stale', () => {
    const lock = generateLockFile(lockSkillsDir, {});
    // Add a skill not in the lock
    mkSkill('new-skill', { 'SKILL.md': '# New\n\nbody' });

    const result = verifyLockStaleness(lockSkillsDir, lock);
    assert.strictEqual(result.stale, true);
    assert.ok(result.missing.includes('new-skill'));
  });

  it('detects staleness when threshold exceeded', () => {
    const oldLock = {
      version: 2,
      generated: {
        lastExtracted: '2020-01-01T00:00:00.000Z',
        stalenessThresholdDays: 1,
      },
      skills: {},
    };
    const result = verifyLockStaleness(lockSkillsDir, oldLock);
    assert.strictEqual(result.thresholdExceeded, true);
    assert.strictEqual(result.stale, true);
  });
});

// ============================================================
// Integration tests: check-lock-staleness.js CLI
// ============================================================
describe('check-lock-staleness CLI', () => {
  let cliDir;

  before(() => {
    cliDir = path.join(TMP_DIR, 'cli-test');
    fs.mkdirSync(cliDir, { recursive: true });
  });

  after(() => {
    fs.rmSync(cliDir, { recursive: true, force: true });
  });

  it('reports error when lock file does not exist', () => {
    try {
      execSync(`node "${CHECK_LOCK_SCRIPT}" --lock-file /nonexistent/lock.json`, { stdio: 'pipe' });
      assert.fail('Should have thrown');
    } catch (e) {
      assert.ok(e.stderr.includes('ERROR'));
      assert.strictEqual(e.status, 1);
    }
  });

  it('reports OK for lock matching current skills tree', () => {
    const skillsDir = path.join(cliDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    const skillDir = path.join(skillsDir, 'test-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '---\nname: test-skill\ndescription: Test\n---\n\n# Test', 'utf8');

    const lock = generateLockFile(skillsDir, {});
    const lockPath = path.join(cliDir, 'skills-lock.json');
    fs.writeFileSync(lockPath, JSON.stringify(lock), 'utf8');

    const result = execSync(`node "${CHECK_LOCK_SCRIPT}" --skills-dir "${skillsDir}" --lock-file "${lockPath}"`, { encoding: 'utf8' });
    assert.ok(result.includes('OK:'));
  });

  it('reports STALE for mismatched lock', () => {
    const skillsDir = path.join(cliDir, 'skills-stale');
    fs.mkdirSync(skillsDir, { recursive: true });
    const skillDir = path.join(skillsDir, 'test-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '---\nname: test-skill\ndescription: Test\n---\n\n# Test', 'utf8');

    const badLock = {
      version: 2,
      generated: { lastExtracted: new Date().toISOString(), stalenessThresholdDays: 30 },
      skills: { 'test-skill': { combinedHash: 'bad0000000000000000000000000000000000000000000000000000000000000', fileHashes: {} } },
    };
    const lockPath = path.join(cliDir, 'bad-lock.json');
    fs.writeFileSync(lockPath, JSON.stringify(badLock), 'utf8');

    try {
      execSync(`node "${CHECK_LOCK_SCRIPT}" --skills-dir "${skillsDir}" --lock-file "${lockPath}"`, { stdio: 'pipe' });
      assert.fail('Should have thrown');
    } catch (e) {
      assert.ok(e.stderr.includes('STALE'));
      assert.strictEqual(e.status, 1);
    }
  });
});
