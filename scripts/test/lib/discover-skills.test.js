const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { discoverSkills } = require('../../lib/discover-skills');

/**
 * Helper: create a temporary directory with a given structure.
 * Returns the temp dir path.
 */
function createTempSkillsDir(subdirs) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'discover-skills-test-'));
  for (const subdir of subdirs) {
    const dirPath = path.join(tmpDir, subdir);
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return tmpDir;
}

/**
 * Create a SKILL.md in a subdirectory under tmpDir.
 */
function createSkillMd(tmpDir, subdir) {
  const skillPath = path.join(tmpDir, subdir, 'SKILL.md');
  fs.writeFileSync(skillPath, '---\nname: test\n---\n# Test', 'utf8');
}

describe('discoverSkills()', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'discover-skills-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('discovers skill directories with SKILL.md', () => {
    fs.mkdirSync(path.join(tmpDir, 'my-skill'), { recursive: true });
    createSkillMd(tmpDir, 'my-skill');
    fs.mkdirSync(path.join(tmpDir, 'another-skill'), { recursive: true });
    createSkillMd(tmpDir, 'another-skill');

    const result = discoverSkills(tmpDir);
    assert.deepStrictEqual(result.sort(), ['another-skill', 'my-skill']);
  });

  it('skips hidden directories (starting with .)', () => {
    fs.mkdirSync(path.join(tmpDir, '.hidden'), { recursive: true });
    createSkillMd(tmpDir, '.hidden');
    fs.mkdirSync(path.join(tmpDir, 'visible'), { recursive: true });
    createSkillMd(tmpDir, 'visible');

    const result = discoverSkills(tmpDir);
    assert.deepStrictEqual(result, ['visible']);
  });

  it('skips configured skipDirs (.git, .full-review, openspec, scripts, node_modules)', () => {
    const skipDirs = ['.git', '.full-review', 'openspec', 'scripts', 'node_modules'];
    for (const d of skipDirs) {
      fs.mkdirSync(path.join(tmpDir, d), { recursive: true });
      createSkillMd(tmpDir, d);
    }
    // Add a valid skill
    fs.mkdirSync(path.join(tmpDir, 'real-skill'), { recursive: true });
    createSkillMd(tmpDir, 'real-skill');

    const result = discoverSkills(tmpDir);
    assert.deepStrictEqual(result, ['real-skill']);
  });

  it('skips non-directories', () => {
    fs.writeFileSync(path.join(tmpDir, 'file.txt'), 'content', 'utf8');
    fs.mkdirSync(path.join(tmpDir, 'real-skill'), { recursive: true });
    createSkillMd(tmpDir, 'real-skill');

    const result = discoverSkills(tmpDir);
    assert.deepStrictEqual(result, ['real-skill']);
  });

  it('skips directories without SKILL.md', () => {
    fs.mkdirSync(path.join(tmpDir, 'no-readme'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'has-readme'), { recursive: true });
    createSkillMd(tmpDir, 'has-readme');

    const result = discoverSkills(tmpDir);
    assert.deepStrictEqual(result, ['has-readme']);
  });

  it('returns empty array for nonexistent directory', () => {
    const result = discoverSkills('/nonexistent/path/that/does/not/exist');
    assert.deepStrictEqual(result, []);
  });

  it('returns empty array for empty directory', () => {
    const result = discoverSkills(tmpDir);
    assert.deepStrictEqual(result, []);
  });

  it('returns empty array when directory contains only files', () => {
    fs.writeFileSync(path.join(tmpDir, 'readme.md'), '# hello', 'utf8');
    fs.writeFileSync(path.join(tmpDir, 'notes.txt'), 'notes', 'utf8');

    const result = discoverSkills(tmpDir);
    assert.deepStrictEqual(result, []);
  });
});
