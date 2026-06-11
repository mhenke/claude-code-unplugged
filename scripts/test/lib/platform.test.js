const { describe, it } = require('node:test');
const assert = require('node:assert');
const { cleanAndNeutralize, renamePath } = require('../../lib/platform');

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

  it('replaces $CLAUDE_PLUGIN_ROOT (without braces) with PLUGIN_ROOT', () => {
    const result = cleanAndNeutralize('Path: $CLAUDE_PLUGIN_ROOT/scripts');
    assert.ok(result.includes('PLUGIN_ROOT'));
    assert.ok(!result.includes('$CLAUDE_PLUGIN_ROOT'));
  });

  it('replaces $CLAUDE_PROJECT_DIR with PROJECT_DIR', () => {
    const result = cleanAndNeutralize('cd "$CLAUDE_PROJECT_DIR"');
    assert.strictEqual(result, 'cd "PROJECT_DIR"');
  });

  it('replaces $CLAUDE_ENV_FILE with ENV_FILE', () => {
    const result = cleanAndNeutralize('echo "export FOO=bar" >> "$CLAUDE_ENV_FILE"');
    assert.ok(result.includes('ENV_FILE'));
    assert.ok(!result.includes('CLAUDE_ENV_FILE'));
  });

  it('replaces $CLAUDE_CODE_REMOTE with CODE_REMOTE', () => {
    const result = cleanAndNeutralize('if [ -n "$CLAUDE_CODE_REMOTE" ]; then');
    assert.ok(result.includes('CODE_REMOTE'));
    assert.ok(!result.includes('CLAUDE_CODE_REMOTE'));
  });

  it('replaces claude-code with coding-assistant', () => {
    const result = cleanAndNeutralize('Run claude-code --continue');
    assert.ok(result.includes('coding-assistant'));
    assert.ok(!result.includes('claude-code'));
  });

  it('replaces claude -- with assistant --', () => {
    const result = cleanAndNeutralize('Run claude --debug or claude --version');
    assert.ok(result.includes('assistant --debug'));
    assert.ok(result.includes('assistant --version'));
    assert.ok(!result.includes('claude --'));
  });

  it('replaces claude-security-guidance with security-guidance', () => {
    const result = cleanAndNeutralize('Create a claude-security-guidance.local.md file');
    assert.ok(result.includes('security-guidance.local.md'));
    assert.ok(!result.includes('claude-security-guidance'));
  });

  it('replaces PLUGIN_ROOT/hooks/ with PLUGIN_ROOT/scripts/', () => {
    const result = cleanAndNeutralize('bash PLUGIN_ROOT/hooks/stop-hook.sh');
    assert.ok(result.includes('PLUGIN_ROOT/scripts/stop-hook.sh'));
    assert.ok(!result.includes('PLUGIN_ROOT/hooks/'));
  });

  it('prefers ${CLAUDE_PLUGIN_ROOT} over $CLAUDE_PLUGIN_ROOT', () => {
    const result = cleanAndNeutralize('Path: ${CLAUDE_PLUGIN_ROOT}/scripts and $CLAUDE_PLUGIN_ROOT/bin');
    assert.ok(!result.includes('CLAUDE_PLUGIN_ROOT'));
    assert.ok(result.includes('PLUGIN_ROOT'));
  });

  it('prefers claude-code over claude -- for claude-code --flag', () => {
    const result = cleanAndNeutralize('Run claude-code --continue');
    assert.ok(result.includes('coding-assistant --continue'));
    assert.ok(!result.includes('claude-code'));
  });
});

describe('renamePath', () => {
  it('renames hooks.json to hook-config.json', () => {
    assert.strictEqual(renamePath('/some/path/hooks.json'), '/some/path/hook-config.json');
  });

  it('leaves other .json files unchanged', () => {
    assert.strictEqual(renamePath('/some/path/other.json'), '/some/path/other.json');
  });

  it('is case-sensitive — HOOKS.JSON is unchanged', () => {
    assert.strictEqual(renamePath('/some/path/HOOKS.JSON'), '/some/path/HOOKS.JSON');
  });

  it('leaves non-JSON files unchanged', () => {
    assert.strictEqual(renamePath('/some/path/skill.md'), '/some/path/skill.md');
  });
});
