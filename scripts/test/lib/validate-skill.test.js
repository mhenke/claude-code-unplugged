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
});
