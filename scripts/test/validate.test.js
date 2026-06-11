const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execSync } = require('node:child_process');

const TMP_DIR = path.join(os.tmpdir(), 'ccu-test-validate-' + crypto.randomUUID());
const VALIDATE_SCRIPT = path.resolve(__dirname, '../validate.js');

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

describe('validate.js', () => {
  before(() => {
    process.env.SKILLS_DIR = TMP_DIR;
  });

  after(() => {
    delete process.env.SKILLS_DIR;
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  });

  beforeEach(() => {
    cleanSkillsDir();
  });

  it('skips a directory with no SKILL.md (handled by discoverSkills)', () => {
    fs.mkdirSync(path.join(TMP_DIR, 'empty-skill'), { recursive: true });
    const result = execSync(`node "${VALIDATE_SCRIPT}"`, { stdio: 'pipe' });
    assert.match(result.toString(), /Validation complete.*0 successful/);
  });

  it('rejects a skill missing frontmatter', () => {
    mkSkillDir('no-frontmatter', '# Just a heading\n\nNo frontmatter here.');
    try {
      execSync(`node "${VALIDATE_SCRIPT}"`, { stdio: 'pipe' });
      assert.fail('Should have exited with code 1');
    } catch (e) {
      assert.strictEqual(e.status, 1);
    }
  });

  it('rejects a skill with mismatched name', () => {
    mkSkillDir('test-skill', '---\nname: wrong-name\ndescription: A test skill\n---\n\n# Test');
    try {
      execSync(`node "${VALIDATE_SCRIPT}"`, { stdio: 'pipe' });
      assert.fail('Should have exited with code 1');
    } catch (e) {
      assert.strictEqual(e.status, 1);
    }
  });

  it('rejects a skill with empty body', () => {
    mkSkillDir('empty-body', '---\nname: empty-body\ndescription: Empty\n---\n');
    try {
      execSync(`node "${VALIDATE_SCRIPT}"`, { stdio: 'pipe' });
      assert.fail('Should have exited with code 1');
    } catch (e) {
      assert.strictEqual(e.status, 1);
    }
  });

  it('rejects a skill with Claude Code references', () => {
    mkSkillDir('cc-ref', '---\nname: cc-ref\ndescription: Has Claude Code ref\n---\n\nThis mentions Claude Code.');
    try {
      execSync(`node "${VALIDATE_SCRIPT}"`, { stdio: 'pipe' });
      assert.fail('Should have exited with code 1');
    } catch (e) {
      assert.strictEqual(e.status, 1);
    }
  });

  it('rejects a skill with slash commands', () => {
    mkSkillDir('slash-cmd', '---\nname: slash-cmd\ndescription: Slash\n---\n\nRun `/commit` to commit.');
    try {
      execSync(`node "${VALIDATE_SCRIPT}"`, { stdio: 'pipe' });
      assert.fail('Should have exited with code 1');
    } catch (e) {
      assert.strictEqual(e.status, 1);
    }
  });

  it('accepts a valid skill', () => {
    mkSkillDir('valid-skill', '---\nname: valid-skill\ndescription: A valid skill description\n---\n\n# Valid Skill\n\nThis is valid body content.');
    const result = execSync(`node "${VALIDATE_SCRIPT}"`, { stdio: 'pipe' });
    assert.match(result.toString(), /Validation complete.*1 successful/);
  });

  it('rejects invalid slug (uppercase)', () => {
    mkSkillDir('Bad-Slug', '---\nname: Bad-Slug\ndescription: Bad slug\n---\n\n# Bad');
    try {
      execSync(`node "${VALIDATE_SCRIPT}"`, { stdio: 'pipe' });
      assert.fail('Should have exited with code 1');
    } catch (e) {
      assert.strictEqual(e.status, 1);
    }
  });

  it('rejects unsupported frontmatter fields', () => {
    mkSkillDir('has-version', '---\nname: has-version\ndescription: Has extra field\nversion: 0.1.0\n---\n\n# Has Version');
    try {
      execSync(`node "${VALIDATE_SCRIPT}"`, { stdio: 'pipe' });
      assert.fail('Should have exited with code 1');
    } catch (e) {
      assert.strictEqual(e.status, 1);
    }
  });
});
