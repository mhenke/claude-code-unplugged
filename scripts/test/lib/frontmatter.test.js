const { describe, it } = require('node:test');
const assert = require('node:assert');
const { parseFrontmatter, stripFrontmatter } = require('../../lib/frontmatter');

describe('extract.js parseFrontmatter', () => {
  it('parses name and description', () => {
    const content = '---\nname: my-skill\ndescription: A test skill\n---\n\n# Body';
    const meta = parseFrontmatter(content);
    assert.strictEqual(meta.name, 'my-skill');
    assert.strictEqual(meta.description, 'A test skill');
  });

  it('parses version field', () => {
    const content = '---\nname: skill\nversion: 1.2.3\ndescription: desc\n---\n\nBody';
    const meta = parseFrontmatter(content);
    assert.strictEqual(meta.version, '1.2.3');
  });

  it('returns empty object for no frontmatter', () => {
    const content = '# Just a heading\n\nNo frontmatter.';
    const meta = parseFrontmatter(content);
    assert.deepStrictEqual(meta, {});
  });

  it('strips quotes from values', () => {
    const content = '---\nname: "quoted-skill"\ndescription: "A quoted description"\n---\n\n# Body';
    const meta = parseFrontmatter(content);
    assert.strictEqual(meta.name, 'quoted-skill');
    assert.strictEqual(meta.description, 'A quoted description');
  });

  it('strips single quotes from values', () => {
    const content = "---\nname: 'single-quoted'\ndescription: 'Single'\n---\n\nBody";
    const meta = parseFrontmatter(content);
    assert.strictEqual(meta.name, 'single-quoted');
    assert.strictEqual(meta.description, 'Single');
  });
});

describe('extract.js stripFrontmatter', () => {
  it('removes frontmatter and returns body', () => {
    const content = '---\nname: skill\ndescription: desc\n---\n\n# Heading\n\nBody text.';
    const body = stripFrontmatter(content);
    const trimmed = body.trimStart();
    assert.strictEqual(trimmed, '# Heading\n\nBody text.');
  });

  it('returns original content if no frontmatter', () => {
    const content = '# Just a heading\n\nNo frontmatter.';
    const body = stripFrontmatter(content);
    assert.strictEqual(body, content);
  });

  it('handles CRLF line endings', () => {
    const content = '---\r\nname: skill\r\ndescription: desc\r\n---\r\n\r\n# Heading';
    const body = stripFrontmatter(content);
    const trimmed = body.trimStart();
    assert.strictEqual(trimmed, '# Heading');
  });
});
