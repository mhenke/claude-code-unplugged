const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execSync } = require('node:child_process');

const TMP_DIR = path.join(os.tmpdir(), 'ccu-test-extract-' + crypto.randomUUID());
const EXTRACT_SCRIPT = path.resolve(__dirname, '../extract.js');

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
