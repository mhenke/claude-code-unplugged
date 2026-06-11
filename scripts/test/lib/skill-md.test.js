const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { writeSkillMd } = require('../../lib/skill-md');

describe('skill-md.js writeSkillMd', () => {
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-md-test-'));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes SKILL.md with correct frontmatter (name + description)', () => {
    const destDir = path.join(tmpDir, 'test-skill');
    writeSkillMd(destDir, 'test-skill', 'A test skill', 'Body content here.');

    const mdPath = path.join(destDir, 'SKILL.md');
    assert.ok(fs.existsSync(mdPath));

    const content = fs.readFileSync(mdPath, 'utf8');
    assert.match(content, /^---\nname: test-skill\ndescription: A test skill\n---\n/);
    assert.ok(content.includes('Body content here.'));
  });

  it('neutralizes "Claude Code" in body content', () => {
    const destDir = path.join(tmpDir, 'neutralize-body');
    writeSkillMd(destDir, 'neutralize-body', 'desc', 'This is from Claude Code.');

    const content = fs.readFileSync(path.join(destDir, 'SKILL.md'), 'utf8');
    assert.ok(!content.includes('Claude Code'));
    assert.ok(content.includes('coding assistant'));
  });

  it('neutralizes "Claude Code" in description', () => {
    const destDir = path.join(tmpDir, 'neutralize-desc');
    writeSkillMd(destDir, 'neutralize-desc', 'Extracted from Claude Code', 'Body.');

    const content = fs.readFileSync(path.join(destDir, 'SKILL.md'), 'utf8');
    assert.ok(!content.includes('Claude Code'));
    assert.ok(content.includes('coding assistant'));
  });

  it('appends verification gate for security-guidance', () => {
    const destDir = path.join(tmpDir, 'security-guidance');
    writeSkillMd(destDir, 'security-guidance', 'Security guidance skill', 'Body.');

    const content = fs.readFileSync(path.join(destDir, 'SKILL.md'), 'utf8');
    assert.ok(content.includes('verification_gate'));
    assert.ok(content.includes('secrets'));
    assert.ok(content.includes('input_sanitization'));
    assert.ok(content.includes('paths'));
  });

  it('appends verification gate for commit-commands', () => {
    const destDir = path.join(tmpDir, 'commit-commands');
    writeSkillMd(destDir, 'commit-commands', 'Commit commands skill', 'Body.');

    const content = fs.readFileSync(path.join(destDir, 'SKILL.md'), 'utf8');
    assert.ok(content.includes('verification_gate'));
    assert.ok(content.includes('conventions'));
    assert.ok(content.includes('correctness'));
  });

  it('does NOT append gate for unknown skill names', () => {
    const destDir = path.join(tmpDir, 'unknown-skill');
    writeSkillMd(destDir, 'unknown-skill', 'An unknown skill', 'Body content.');

    const content = fs.readFileSync(path.join(destDir, 'SKILL.md'), 'utf8');
    assert.ok(!content.includes('verification_gate'));
  });

  it('creates destination directory if it does not exist', () => {
    const destDir = path.join(tmpDir, 'new-dir', 'nested', 'skill');
    assert.ok(!fs.existsSync(destDir));

    writeSkillMd(destDir, 'nested-skill', 'Nested skill', 'Body.');

    assert.ok(fs.existsSync(destDir));
    assert.ok(fs.existsSync(path.join(destDir, 'SKILL.md')));
  });

  it('handles body content with trailing whitespace and newlines', () => {
    const destDir = path.join(tmpDir, 'trailing-whitespace');
    const body = '# Title\n\nSome content.\n\n  \n\n';
    writeSkillMd(destDir, 'trailing-skill', 'Desc', body);

    const content = fs.readFileSync(path.join(destDir, 'SKILL.md'), 'utf8');
    // After trimming, no trailing whitespace/newlines after the final newline
    const lines = content.split('\n');
    // Last line should be empty (the final \n)
    // Second-to-last should not be whitespace
    const secondToLast = lines[lines.length - 2];
    assert.ok(secondToLast !== '  ');
    assert.ok(content.includes('Some content.'));
  });
});
