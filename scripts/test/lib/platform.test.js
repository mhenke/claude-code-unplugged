const { describe, it } = require('node:test');
const assert = require('node:assert');
const { cleanAndNeutralize } = require('../../lib/platform');

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
