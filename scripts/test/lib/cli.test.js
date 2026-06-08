const { describe, it } = require('node:test');
const assert = require('node:assert');
const { parseArgs } = require('../../lib/cli');

describe('extract.js parseArgs', () => {
  it('parses --source and --target', () => {
    const result = parseArgs(['--source', '/src', '--target', '/dst']);
    assert.strictEqual(result.source, '/src');
    assert.strictEqual(result.target, '/dst');
    assert.strictEqual(result.help, false);
  });

  it('parses short flags -s and -t', () => {
    const result = parseArgs(['-s', '/src', '-t', '/dst']);
    assert.strictEqual(result.source, '/src');
    assert.strictEqual(result.target, '/dst');
  });

  it('parses --help', () => {
    const result = parseArgs(['--help']);
    assert.strictEqual(result.help, true);
  });

  it('parses -h', () => {
    const result = parseArgs(['-h']);
    assert.strictEqual(result.help, true);
  });

  it('returns empty strings for missing args', () => {
    const result = parseArgs([]);
    assert.strictEqual(result.source, '');
    assert.strictEqual(result.target, '');
    assert.strictEqual(result.help, false);
  });
});
