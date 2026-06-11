const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { copyRecursiveSync, ensureDir, sanitizePath } = require('../../lib/files');

const TMP_DIR = path.resolve(__dirname, '../../../tmp-test-files');

describe('files.js', () => {
  before(() => {
    if (fs.existsSync(TMP_DIR)) fs.rmSync(TMP_DIR, { recursive: true, force: true });
    fs.mkdirSync(TMP_DIR, { recursive: true });
  });

  after(() => {
    if (fs.existsSync(TMP_DIR)) fs.rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it('ensureDir creates directory', () => {
    const testDir = path.join(TMP_DIR, 'nested', 'dirs');
    ensureDir(testDir);
    assert.ok(fs.existsSync(testDir));
  });

  it('copyRecursiveSync copies files with transform', () => {
    const srcDir = path.join(TMP_DIR, 'src-transform');
    const destDir = path.join(TMP_DIR, 'dest-transform');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'test.md'), 'Hello Claude Code', 'utf8');

    copyRecursiveSync(srcDir, destDir, {
      transform: (content) => content.replace('Claude Code', 'coding assistant')
    });

    const result = fs.readFileSync(path.join(destDir, 'test.md'), 'utf8');
    assert.ok(result.includes('coding assistant'));
    assert.ok(!result.includes('Claude Code'));
  });

  it('copyRecursiveSync uses mapDest to rename files', () => {
    const srcDir = path.join(TMP_DIR, 'src-map');
    const destDir = path.join(TMP_DIR, 'dest-map');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'hooks.json'), '{}', 'utf8');

    copyRecursiveSync(srcDir, destDir, {
      mapDest: (destPath, srcPath) => {
        if (path.basename(srcPath) === 'hooks.json') {
          return path.join(path.dirname(destPath), 'hook-config.json');
        }
        return destPath;
      }
    });

    assert.ok(!fs.existsSync(path.join(destDir, 'hooks.json')));
    assert.ok(fs.existsSync(path.join(destDir, 'hook-config.json')));
  });

  it('copyRecursiveSync copies binary files without transform', () => {
    const srcDir = path.join(TMP_DIR, 'src-binary');
    const destDir = path.join(TMP_DIR, 'dest-binary');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'image.png'), Buffer.from([0x89, 0x50, 0x4E, 0x47]));

    copyRecursiveSync(srcDir, destDir, {
      transform: () => { throw new Error('should not be called'); }
    });

    assert.ok(fs.existsSync(path.join(destDir, 'image.png')));
    const content = fs.readFileSync(path.join(destDir, 'image.png'));
    assert.strictEqual(content[0], 0x89);
  });

  it('sanitizePath rejects names containing ".."', () => {
    assert.throws(() => sanitizePath('.._evil'), /Path traversal detected/);
  });

  it('sanitizePath rejects names containing "/"', () => {
    assert.throws(() => sanitizePath('foo/bar'), /Path traversal detected/);
  });

  it('sanitizePath allows valid directory names', () => {
    assert.strictEqual(sanitizePath('my-skill'), 'my-skill');
    assert.strictEqual(sanitizePath('skill-name-123'), 'skill-name-123');
  });

  it('copyRecursiveSync rejects directory names with path traversal', () => {
    const srcDir = path.join(TMP_DIR, 'src-traversal');
    const destDir = path.join(TMP_DIR, 'dest-traversal');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.mkdirSync(path.join(srcDir, '.._evil'), { recursive: true });
    fs.writeFileSync(path.join(srcDir, '.._evil', 'test.md'), 'content', 'utf8');

    assert.throws(() => {
      copyRecursiveSync(srcDir, destDir);
    }, /Path traversal detected/);
  });
});
