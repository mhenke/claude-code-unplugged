const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const {
  parseArgs,
  cleanAndNeutralize,
  parseFrontmatter,
  stripFrontmatter,
  extractAdditionalContext,
} = require('../extract.js');

const TMP_DIR = path.resolve(__dirname, '../../tmp-test-extract');
const EXTRACT_SCRIPT = path.resolve(__dirname, '../extract.js');

function cleanTmpDir() {
  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

// ============================================================
// Unit tests: parseArgs
// ============================================================
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

// ============================================================
// Unit tests: cleanAndNeutralize
// ============================================================
describe('extract.js cleanAndNeutralize', () => {
  it('replaces "Claude Code" with "coding assistant"', () => {
    const result = cleanAndNeutralize('This is about Claude Code features.');
    assert.ok(result.includes('coding assistant'));
    assert.ok(!result.includes('Claude Code'));
  });

  it('replaces hooks.json with hook-config.json', () => {
    const result = cleanAndNeutralize('Edit hooks.json to configure hooks.');
    assert.ok(result.includes('hook-config.json'));
    assert.ok(!result.includes('hooks.json'));
  });

  it('replaces ${CLAUDE_PLUGIN_ROOT} with PLUGIN_ROOT', () => {
    const result = cleanAndNeutralize('Path: ${CLAUDE_PLUGIN_ROOT}/scripts');
    assert.ok(result.includes('PLUGIN_ROOT'));
    assert.ok(!result.includes('CLAUDE_PLUGIN_ROOT'));
  });

  it('replaces .claude/ with .agent/', () => {
    const result = cleanAndNeutralize('Config lives in .claude/ directory.');
    assert.ok(result.includes('.agent/'));
    assert.ok(!result.includes('.claude/'));
  });

  it('strips forward-slash from slash commands in backticks', () => {
    const result = cleanAndNeutralize('Run `/commit` to commit or `/code-review` for review.');
    assert.ok(result.includes('`commit`'));
    assert.ok(result.includes('`code-review`'));
    assert.ok(!result.includes('`/commit`'));
    assert.ok(!result.includes('`/code-review`'));
  });

  it('handles content with no platform references', () => {
    const input = 'Just a normal prompt with no platform specifics.';
    const result = cleanAndNeutralize(input);
    assert.strictEqual(result, input);
  });

  it('handles empty string', () => {
    const result = cleanAndNeutralize('');
    assert.strictEqual(result, '');
  });

  it('neutralizes multiple patterns in same content', () => {
    const input = 'Run Claude Code with `${CLAUDE_PLUGIN_ROOT}` set, using `.claude/hooks.json` and `/commit`.';
    const result = cleanAndNeutralize(input);
    assert.ok(!result.includes('Claude Code'));
    assert.ok(!result.includes('${CLAUDE_PLUGIN_ROOT}'));
    assert.ok(!result.includes('.claude/'));
    assert.ok(!result.includes('hooks.json'));
    assert.ok(!result.includes('`/commit`'));
    assert.ok(result.includes('coding assistant'));
    assert.ok(result.includes('PLUGIN_ROOT'));
    assert.ok(result.includes('.agent/'));
    assert.ok(result.includes('hook-config.json'));
    assert.ok(result.includes('`commit`'));
  });

  it('preserves non-platform content around replacements', () => {
    const input = 'Before Claude Code middle after.';
    const result = cleanAndNeutralize(input);
    assert.ok(result.startsWith('Before'));
    assert.ok(result.endsWith('after.'));
  });
});

// ============================================================
// Unit tests: parseFrontmatter
// ============================================================
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

// ============================================================
// Unit tests: stripFrontmatter
// ============================================================
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

// ============================================================
// Unit tests: extractAdditionalContext
// ============================================================
describe('extract.js extractAdditionalContext', () => {
  it('returns empty string for nonexistent file', () => {
    const result = extractAdditionalContext('/nonexistent/path/script.sh');
    assert.strictEqual(result, '');
  });

  it('extracts additionalContext from JSON in heredoc', () => {
    const shFile = path.join(TMP_DIR, 'session-start.sh');
    fs.mkdirSync(TMP_DIR, { recursive: true });
    const shContent = `#!/bin/bash\ncat << 'EOF'\n{"hookSpecificOutput":{"additionalContext":"This is extra context"}}\nEOF\n`;
    fs.writeFileSync(shFile, shContent, 'utf8');

    const result = extractAdditionalContext(shFile);
    assert.strictEqual(result, 'This is extra context');

    fs.rmSync(shFile);
  });

  it('returns empty string when heredoc contains invalid JSON', () => {
    const shFile = path.join(TMP_DIR, 'bad-json.sh');
    fs.mkdirSync(TMP_DIR, { recursive: true });
    const shContent = `#!/bin/bash\ncat << 'EOF'\n{not valid json}\nEOF\n`;
    fs.writeFileSync(shFile, shContent, 'utf8');

    const result = extractAdditionalContext(shFile);
    assert.strictEqual(result, '');

    fs.rmSync(shFile);
  });
});

// ============================================================
// Integration tests: extract.js CLI
// ============================================================
describe('extract.js CLI integration', () => {
  let sourceDir;
  let targetDir;

  before(() => {
    cleanTmpDir();
    sourceDir = path.join(TMP_DIR, 'mock-source');
    targetDir = path.join(TMP_DIR, 'mock-target');
    fs.mkdirSync(sourceDir, { recursive: true });
    fs.mkdirSync(targetDir, { recursive: true });
  });

  after(() => {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it('exits with error when no args provided', () => {
    try {
      execSync(`node "${EXTRACT_SCRIPT}"`, { stdio: 'pipe' });
      assert.fail('Should have exited with code 1');
    } catch (e) {
      assert.strictEqual(e.status, 1);
    }
  });

  it('prints usage with --help', () => {
    const result = execSync(`node "${EXTRACT_SCRIPT}" --help`, { stdio: 'pipe' });
    assert.match(result.toString(), /Usage:/);
  });

  it('exits with error when source does not exist', () => {
    try {
      execSync(`node "${EXTRACT_SCRIPT}" --source /nonexistent/path --target ${targetDir}`, { stdio: 'pipe' });
      assert.fail('Should have exited with code 1');
    } catch (e) {
      assert.strictEqual(e.status, 1);
    }
  });

  it('exits with error when source is not a directory', () => {
    const filePath = path.join(TMP_DIR, 'not-a-dir.txt');
    fs.writeFileSync(filePath, 'not a directory', 'utf8');
    try {
      execSync(`node "${EXTRACT_SCRIPT}" --source ${filePath} --target ${targetDir}`, { stdio: 'pipe' });
      assert.fail('Should have exited with code 1');
    } catch (e) {
      assert.strictEqual(e.status, 1);
    }
  });

  it('extracts skills from mock source with direct skills', () => {
    const mockPluginsDir = path.join(sourceDir, 'plugins');
    fs.mkdirSync(path.join(mockPluginsDir, 'my-plugin', 'skills', 'my-skill'), { recursive: true });
    fs.writeFileSync(
      path.join(mockPluginsDir, 'my-plugin', 'skills', 'my-skill', 'SKILL.md'),
      '---\nname: my-skill\ndescription: A test skill extracted from Claude Code\n---\n\n# My Skill\n\nBody content.',
      'utf8'
    );

    const result = execSync(`node "${EXTRACT_SCRIPT}" --source ${sourceDir} --target ${targetDir}`, { stdio: 'pipe' });
    const output = result.toString();
    assert.match(output, /Copying direct skill: my-skill/);
    assert.match(output, /Extraction completed successfully/);

    const destSkillMd = path.join(targetDir, 'my-skill', 'SKILL.md');
    assert.ok(fs.existsSync(destSkillMd));
    const content = fs.readFileSync(destSkillMd, 'utf8');
    assert.ok(!content.includes('Claude Code'));
    assert.ok(content.includes('coding assistant'));
  });

  it('merges commands for known plugin configs', () => {
    const pluginDir = path.join(sourceDir, 'plugins', 'commit-commands');
    fs.mkdirSync(path.join(pluginDir, 'commands'), { recursive: true });
    fs.writeFileSync(
      path.join(pluginDir, 'commands', 'commit.md'),
      '---\ndescription: Commit changes\n---\n\nRun `git commit`.',
      'utf8'
    );
    fs.writeFileSync(
      path.join(pluginDir, 'commands', 'push.md'),
      '---\ndescription: Push changes\n---\n\nRun `git push`.',
      'utf8'
    );

    execSync(`node "${EXTRACT_SCRIPT}" --source ${sourceDir} --target ${targetDir}`, { stdio: 'pipe' });

    const destSkillMd = path.join(targetDir, 'commit-commands', 'SKILL.md');
    assert.ok(fs.existsSync(destSkillMd));
    const content = fs.readFileSync(destSkillMd, 'utf8');
    assert.ok(content.includes('Commands / Workflows'));
    assert.ok(content.includes('commit'));
    assert.ok(content.includes('push'));
  });

  it('handles empty source gracefully', () => {
    const emptySourceDir = path.join(TMP_DIR, 'empty-source');
    fs.mkdirSync(emptySourceDir, { recursive: true });
    const emptyTargetDir = path.join(TMP_DIR, 'empty-target');
    fs.mkdirSync(emptyTargetDir, { recursive: true });

    const result = execSync(`node "${EXTRACT_SCRIPT}" --source ${emptySourceDir} --target ${emptyTargetDir}`, { stdio: 'pipe' });
    const output = result.toString();
    assert.match(output, /Extraction completed successfully/);
  });

  it('skips missing plugin dirs gracefully', () => {
    const result = execSync(`node "${EXTRACT_SCRIPT}" --source ${sourceDir} --target ${targetDir}`, { stdio: 'pipe' });
    const output = result.toString();
    assert.match(output, /Extraction completed successfully/);
  });
});
