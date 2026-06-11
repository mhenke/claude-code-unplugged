const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { processOutputStyles } = require('../../pipeline/output-styles');

describe('output-styles.js processOutputStyles', () => {
  let tmpDir;
  let sourcePath;
  let skillsDestDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'output-styles-test-'));
    sourcePath = tmpDir;
    skillsDestDir = path.join(tmpDir, 'skills');
    fs.mkdirSync(path.join(sourcePath, 'plugins'), { recursive: true });
    fs.mkdirSync(skillsDestDir, { recursive: true });
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function createSessionStart(pluginName, additionalContext) {
    const shDir = path.join(sourcePath, 'plugins', pluginName, 'hooks-handlers');
    fs.mkdirSync(shDir, { recursive: true });
    const jsonPayload = JSON.stringify({
      hookSpecificOutput: { additionalContext },
    });
    fs.writeFileSync(
      path.join(shDir, 'session-start.sh'),
      `cat << 'EOF'\n${jsonPayload}\nEOF\n`,
      'utf8'
    );
  }

  it('processes a plugin with valid additionalContext', () => {
    createSessionStart('explanatory-output-style', 'Explain things step by step.');

    processOutputStyles(sourcePath, skillsDestDir);

    const skillDir = path.join(skillsDestDir, 'explanatory-output-style');
    const mdPath = path.join(skillDir, 'SKILL.md');
    assert.ok(fs.existsSync(mdPath), 'SKILL.md should exist for explanatory-output-style');

    const content = fs.readFileSync(mdPath, 'utf8');
    assert.match(content, /name: explanatory-output-style/);
    assert.ok(content.includes('Explain things step by step.'));
    assert.ok(content.includes('Explanatory Output Style'));
  });

  it('skips a plugin whose session-start.sh does not exist', () => {
    // learning-output-style has no session-start.sh
    processOutputStyles(sourcePath, skillsDestDir);

    // Should not create a skill dir for learning-output-style since we deleted nothing
    // and it was never created
    const skillDir = path.join(skillsDestDir, 'learning-output-style');
    assert.ok(!fs.existsSync(skillDir), 'Should not create dir for missing session-start.sh');
  });

  it('skips a plugin whose additionalContext is empty', () => {
    createSessionStart('learning-output-style', '');

    processOutputStyles(sourcePath, skillsDestDir);

    const skillDir = path.join(skillsDestDir, 'learning-output-style');
    // Should not write the skill if additionalContext is empty
    assert.ok(!fs.existsSync(skillDir), 'Should not create dir when additionalContext is empty');
  });

  it('handles missing pluginsDir gracefully', () => {
    // Should not throw when plugins subdir does not exist
    const missingSource = path.join(tmpDir, 'nonexistent');
    assert.doesNotThrow(() => {
      processOutputStyles(missingSource, skillsDestDir);
    });
  });
});
