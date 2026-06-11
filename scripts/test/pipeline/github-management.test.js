const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { processGitHubManagement } = require('../../pipeline/github-management');

describe('github-management.js processGitHubManagement', () => {
  let tmpDir;
  let sourcePath;
  let skillsDestDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'github-mgmt-test-'));
    sourcePath = tmpDir;
    skillsDestDir = path.join(tmpDir, 'skills');
    fs.mkdirSync(skillsDestDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('processes a directory with script files', () => {
    const scriptsDir = path.join(sourcePath, 'scripts');
    fs.mkdirSync(scriptsDir, { recursive: true });
    fs.writeFileSync(path.join(scriptsDir, 'sync-issues.sh'), '#!/bin/bash\necho "Sync issues"', 'utf8');
    fs.writeFileSync(path.join(scriptsDir, 'label-pr.sh'), '#!/bin/bash\necho "Label PR"', 'utf8');

    processGitHubManagement(sourcePath, skillsDestDir);

    // Verify scripts were copied
    const destScriptsDir = path.join(skillsDestDir, 'github-management', 'scripts');
    assert.ok(fs.existsSync(path.join(destScriptsDir, 'sync-issues.sh')));
    assert.ok(fs.existsSync(path.join(destScriptsDir, 'label-pr.sh')));

    // Verify SKILL.md was generated
    const mdPath = path.join(skillsDestDir, 'github-management', 'SKILL.md');
    assert.ok(fs.existsSync(mdPath));

    const content = fs.readFileSync(mdPath, 'utf8');
    assert.match(content, /name: github-management/);
    assert.ok(content.includes('Issue and pull request lifecycle automation scripts'));
    assert.ok(content.includes('sync-issues.sh'));
    assert.ok(content.includes('label-pr.sh'));
    assert.ok(content.includes('Available Scripts'));
  });

  it('neutralizes content in copied scripts', () => {
    // Add a script with platform-specific references
    const scriptsDir = path.join(sourcePath, 'scripts');
    fs.mkdirSync(scriptsDir, { recursive: true });
    fs.writeFileSync(
      path.join(scriptsDir, 'claude-helper.sh'),
      '#!/bin/bash\n# This script is for Claude Code\n',
      'utf8'
    );

    processGitHubManagement(sourcePath, skillsDestDir);

    const destPath = path.join(skillsDestDir, 'github-management', 'scripts', 'claude-helper.sh');
    const content = fs.readFileSync(destPath, 'utf8');
    assert.ok(!content.includes('Claude Code'));
    assert.ok(content.includes('coding assistant'));
  });

  it('skips if scripts dir does not exist under sourcePath', () => {
    // sourcePath exists but has no scripts/ subdirectory
    const emptySource = path.join(tmpDir, 'empty-source');
    fs.mkdirSync(emptySource, { recursive: true });
    assert.doesNotThrow(() => {
      processGitHubManagement(emptySource, skillsDestDir);
    });

    // Should not create the github-management dir
    const mgmtDir = path.join(skillsDestDir, 'github-management');
    assert.ok(!fs.existsSync(mgmtDir));
  });

  it('skips if sourcePath does not exist', () => {
    const missingDir = path.join(tmpDir, 'does-not-exist');
    assert.doesNotThrow(() => {
      processGitHubManagement(missingDir, skillsDestDir);
    });

    const mgmtDir = path.join(skillsDestDir, 'github-management');
    assert.ok(!fs.existsSync(mgmtDir));
  });
});
