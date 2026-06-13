const { describe, it } = require('node:test');
const assert = require('node:assert');
const { validateSkill } = require('../../lib/validate-skill');

describe('validateSkill()', () => {
  it('returns valid for a skill with correct frontmatter', () => {
    const content = '---\nname: valid-skill\ndescription: A valid skill description\n---\n\n# Valid Skill\n\nThis is valid body content.';
    const result = validateSkill('valid-skill', content);
    assert.strictEqual(result.valid, true);
    assert.deepStrictEqual(result.errors, []);
  });

  it('rejects content missing frontmatter delimiter', () => {
    const content = '# Just a heading\n\nNo frontmatter here.';
    const result = validateSkill('no-frontmatter', content);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('does not start with YAML frontmatter delimiter')));
  });

  it('rejects unsupported frontmatter fields', () => {
    const content = '---\nname: test-skill\ndescription: Test\nversion: 1.0\n---\n\nBody';
    const result = validateSkill('test-skill', content);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Unsupported frontmatter fields')));
    assert.ok(result.errors.some(e => e.includes('version')));
  });

  it('rejects missing name field', () => {
    const content = '---\ndescription: Test\n---\n\nBody';
    const result = validateSkill('test-skill', content);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Missing "name" field')));
  });

  it('rejects name mismatch with directory', () => {
    const content = '---\nname: wrong-name\ndescription: A test skill\n---\n\n# Test';
    const result = validateSkill('test-skill', content);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('does not match folder name')));
  });

  it('rejects missing description field', () => {
    const content = '---\nname: test-skill\n---\n\nBody';
    const result = validateSkill('test-skill', content);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Missing "description" field')));
  });

  it('rejects invalid slug name', () => {
    const content = '---\nname: Bad-Slug\ndescription: Bad slug\n---\n\n# Bad';
    const result = validateSkill('Bad-Slug', content);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('not a valid slug')));
  });

  it('rejects empty body after frontmatter', () => {
    const content = '---\nname: empty-body\ndescription: Empty\n---\n';
    const result = validateSkill('empty-body', content);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('empty instruction body')));
  });

  it('rejects platform-neutrality violations', () => {
    const content = '---\nname: test-skill\ndescription: Test\n---\n\nMentions Claude Code.';
    const result = validateSkill('test-skill', content);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Platform-neutrality violation')));
    assert.ok(result.errors.some(e => e.includes('Claude Code')));
  });

  it('collects multiple errors at once', () => {
    const content = '---\nname: different-name\n---\n';
    const result = validateSkill('test-skill', content);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('does not match folder name')));
    assert.ok(result.errors.some(e => e.includes('Missing "description" field')));
    assert.ok(result.errors.some(e => e.includes('empty instruction body')));
    assert.ok(result.errors.length >= 3);
  });

  it('preserves .trim() behavior on body check', () => {
    // Content with whitespace-only body after frontmatter
    const content = '---\nname: test-skill\ndescription: Test\n---\n  \n  ';
    const result = validateSkill('test-skill', content);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('empty instruction body')));
  });

  it('accepts valid body with leading whitespace preserved', () => {
    // Content with frontmatter and whitespace content (not just whitespace)
    const content = '---\nname: test-skill\ndescription: Test\n---\n  \n  actual content';
    const result = validateSkill('test-skill', content);
    assert.strictEqual(result.valid, true);
    assert.deepStrictEqual(result.errors, []);
  });

  it('handles content without three-dash but with parseable fields', () => {
    const content = 'name: test-skill\ndescription: Test';
    const result = validateSkill('test-skill', content);
    assert.strictEqual(result.valid, false);
    // Should report missing frontmatter, missing name, missing description
    assert.ok(result.errors.some(e => e.includes('does not start with YAML frontmatter delimiter')));
  });

  it('detects new portable-bundle neutrality violations via platform.js delegation', () => {
    const content = '---\nname: test-skill\ndescription: Test\n---\n\n' +
      'Use cc --plugin-dir to load plugins. Temp files go in /tmp/claude/.\n' +
      'Run !`bash build.sh` and reference CLAUDE_PLUGIN_ROOT.';
    const result = validateSkill('test-skill', content);
    assert.strictEqual(result.valid, false);
    // Should detect multiple violations from the new patterns
    const violations = result.errors.filter(e => e.includes('Platform-neutrality violation'));
    // !`cmd` is clean-only (no label), so expect 3 violations: cc --plugin-dir, /tmp/claude/, CLAUDE_PLUGIN_ROOT
    assert.ok(violations.length >= 3, `Expected >=3 violations, got ${violations.length}: ${violations.join(', ')}`);
    assert.ok(violations.some(v => v.includes('cc --plugin-dir')));
    assert.ok(violations.some(v => v.includes('/tmp/claude/')));
    assert.ok(violations.some(v => v.includes('CLAUDE_PLUGIN_ROOT')));
  });
});
