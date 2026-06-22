const { describe, it } = require('node:test');
const assert = require('node:assert');
const { parseSkillFrontmatter, normalizeSkillFrontmatter } = require('../../lib/frontmatter');

describe('frontmatter.js parseSkillFrontmatter', () => {
  it('parses name and description', () => {
    const content = '---\nname: my-skill\ndescription: A test skill\n---\n\n# Body';
    const result = parseSkillFrontmatter(content);
    assert.strictEqual(result.name, 'my-skill');
    assert.strictEqual(result.description, 'A test skill');
    assert.strictEqual(result.meta.name, 'my-skill');
    assert.strictEqual(result.meta.description, 'A test skill');
  });

  it('exposes raw meta for all fields', () => {
    const content = '---\nname: skill\nversion: 1.2.3\ndescription: desc\n---\n\nBody';
    const result = parseSkillFrontmatter(content);
    assert.strictEqual(result.name, 'skill');
    assert.strictEqual(result.description, 'desc');
    assert.strictEqual(result.meta.version, '1.2.3');
    assert.deepStrictEqual(Object.keys(result.meta).sort(), ['description', 'name', 'version']);
  });

  it('returns empty meta and body for no frontmatter', () => {
    const content = '# Just a heading\n\nNo frontmatter.';
    const result = parseSkillFrontmatter(content);
    assert.deepStrictEqual(result.meta, {});
    assert.strictEqual(result.name, '');
    assert.strictEqual(result.description, '');
    assert.strictEqual(result.platformExempt, false);
    assert.strictEqual(result.body, content);
  });

  it('strips quotes from values', () => {
    const content = '---\nname: "quoted-skill"\ndescription: "A quoted description"\n---\n\n# Body';
    const result = parseSkillFrontmatter(content);
    assert.strictEqual(result.name, 'quoted-skill');
    assert.strictEqual(result.description, 'A quoted description');
  });

  it('strips single quotes from values', () => {
    const content = "---\nname: 'single-quoted'\ndescription: 'Single'\n---\n\nBody";
    const result = parseSkillFrontmatter(content);
    assert.strictEqual(result.name, 'single-quoted');
    assert.strictEqual(result.description, 'Single');
  });

  it('coerces platformExempt to boolean: "true" → true', () => {
    const content = '---\nname: test\nplatformExempt: true\ndescription: desc\n---\n\nBody';
    const result = parseSkillFrontmatter(content);
    assert.strictEqual(result.platformExempt, true);
  });

  it('coerces platformExempt to boolean: "false" → false', () => {
    const content = '---\nname: test\nplatformExempt: false\ndescription: desc\n---\n\nBody';
    const result = parseSkillFrontmatter(content);
    assert.strictEqual(result.platformExempt, false);
  });

  it('coerces platformExempt to boolean: absent → false', () => {
    const content = '---\nname: test\ndescription: desc\n---\n\nBody';
    const result = parseSkillFrontmatter(content);
    assert.strictEqual(result.platformExempt, false);
  });

  it('coerces platformExempt to boolean: random string → false', () => {
    const content = '---\nname: test\nplatformExempt: yes\ndescription: desc\n---\n\nBody';
    const result = parseSkillFrontmatter(content);
    assert.strictEqual(result.platformExempt, false);
  });

  it('provides body via .body field', () => {
    const content = '---\nname: skill\ndescription: desc\n---\n\n# Heading\n\nBody text.';
    const result = parseSkillFrontmatter(content);
    assert.strictEqual(result.body.trim(), '# Heading\n\nBody text.');
  });

  it('handles CRLF line endings in body extraction', () => {
    const content = '---\r\nname: skill\r\ndescription: desc\r\n---\r\n\r\n# Heading';
    const result = parseSkillFrontmatter(content);
    assert.strictEqual(result.body.trim(), '# Heading');
  });
});

describe('frontmatter.js normalizeSkillFrontmatter', () => {
  it('rewrites frontmatter to name+description form', () => {
    const content = '---\nname: old-name\ndescription: A skill\ncustom: extra\n---\n\nBody';
    const result = normalizeSkillFrontmatter(content, 'new-name');
    assert.match(result, /^---\nname: new-name\ndescription: A skill\n---/);
    assert.ok(result.includes('\n\nBody'));
  });

  it('overrides name when skillName is provided', () => {
    const content = '---\nname: old-name\ndescription: A skill\n---\n\nBody';
    const result = normalizeSkillFrontmatter(content, 'new-name');
    assert.ok(result.includes('name: new-name'));
    assert.ok(result.includes('description: A skill'));
  });

  it('preserves description when no skillName', () => {
    const content = '---\nname: my-skill\ndescription: A test skill\n---\n\nBody';
    const result = normalizeSkillFrontmatter(content);
    assert.ok(result.includes('name: my-skill'));
    assert.ok(result.includes('description: A test skill'));
  });

  it('returns content unchanged if no frontmatter', () => {
    const content = '# No frontmatter\n\nBody.';
    const result = normalizeSkillFrontmatter(content);
    assert.strictEqual(result, content);
  });
});
