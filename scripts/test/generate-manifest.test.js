const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const TMP_DIR = path.resolve(__dirname, '../../tmp-test-skills-gen');
const MANIFEST_SCRIPT = path.resolve(__dirname, '../generate-manifest.js');
const ROOT_DIR = path.resolve(__dirname, '../..');
const ORIG_JSON = path.join(ROOT_DIR, 'skills.json');
const BAK_JSON = ORIG_JSON + '.bak';

function cleanSkillsDir() {
  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

function mkSkillDir(name, content) {
  const dir = path.join(TMP_DIR, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), content, 'utf8');
}

describe('generate-manifest.js', () => {
  before(() => {
    fs.mkdirSync(TMP_DIR, { recursive: true });
    process.env.SKILLS_DIR = TMP_DIR;
    if (fs.existsSync(ORIG_JSON)) fs.renameSync(ORIG_JSON, BAK_JSON);
  });

  after(() => {
    delete process.env.SKILLS_DIR;
    if (fs.existsSync(ORIG_JSON)) { try { fs.unlinkSync(ORIG_JSON); } catch {} }
    if (fs.existsSync(BAK_JSON)) fs.renameSync(BAK_JSON, ORIG_JSON);
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  });

  beforeEach(() => {
    cleanSkillsDir();
    if (fs.existsSync(ORIG_JSON)) fs.unlinkSync(ORIG_JSON);
    delete process.env.SOURCE_REPOSITORY;
    delete process.env.SOURCE_COMMIT;
  });

  it('generates manifest for valid skills', () => {
    mkSkillDir('alpha-skill', '---\nname: alpha-skill\ndescription: First test skill\n---\n\n# Alpha\n\nBody here.');
    mkSkillDir('beta-skill', '---\nname: beta-skill\ndescription: Second test skill\n---\n\n# Beta\n\nBody here.');

    const result = execSync(`node "${MANIFEST_SCRIPT}"`, { stdio: 'pipe' });
    assert.match(result.toString(), /Generated skills.json with 2 skills/);

    const manifest = JSON.parse(fs.readFileSync(ORIG_JSON, 'utf8'));
    assert.strictEqual(manifest.skills.length, 2);
    assert.strictEqual(manifest.skills[0].name, 'alpha-skill');
    assert.strictEqual(manifest.skills[1].name, 'beta-skill');
    assert.strictEqual(manifest.skills[0].version, '0.1.0');
    assert.strictEqual(manifest.skills[1].version, '0.1.0');
    assert.ok(typeof manifest.skills[0].bodyLength === 'number');
  });

  it('writes source provenance from environment', () => {
    process.env.SOURCE_REPOSITORY = 'https://github.com/anthropics/claude-code.git';
    process.env.SOURCE_COMMIT = 'abc1234';
    mkSkillDir('alpha-skill', '---\nname: alpha-skill\ndescription: First test skill\n---\n\n# Alpha\n\nBody here.');

    execSync(`node "${MANIFEST_SCRIPT}"`, { stdio: 'pipe' });

    const manifest = JSON.parse(fs.readFileSync(ORIG_JSON, 'utf8'));
    assert.deepStrictEqual(manifest.provenance, {
      sourceRepository: 'https://github.com/anthropics/claude-code.git',
      sourceCommit: 'abc1234',
    });
  });

  it('skips skill with no frontmatter', () => {
    mkSkillDir('no-fm', '# No frontmatter\n\nBody content here.');
    execSync(`node "${MANIFEST_SCRIPT}"`, { stdio: 'pipe' });
    const manifest = JSON.parse(fs.readFileSync(ORIG_JSON, 'utf8'));
    const names = manifest.skills.map(s => s.name);
    assert.ok(!names.includes('no-fm'));
  });

  it('handles empty skills directory', () => {
    cleanSkillsDir();
    const result = execSync(`node "${MANIFEST_SCRIPT}"`, { stdio: 'pipe' });
    assert.match(result.toString(), /Generated skills.json with 0 skills/);
  });
});
