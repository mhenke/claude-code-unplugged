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

  // --- New portable-bundle patterns ---

  it('replaces "cc --plugin-dir" with "agent --plugin-dir"', () => {
    const result = cleanAndNeutralize('Run cc --plugin-dir /path/to/plugins');
    assert.ok(result.includes('agent --plugin-dir'));
    assert.ok(!result.includes('cc --plugin-dir'));
  });

  it('replaces "/tmp/claude/" with "/tmp/agent/"', () => {
    const result = cleanAndNeutralize('Output written to /tmp/claude/debug.txt');
    assert.ok(result.includes('/tmp/agent/'));
    assert.ok(!result.includes('/tmp/claude/'));
  });

  it('replaces "!`cmd`" inline interpolation with bash instruction', () => {
    const result = cleanAndNeutralize('Run !`bash scripts/build.sh` to build');
    assert.ok(result.includes('Retrieve by running'));
    assert.ok(result.includes('bash scripts/build.sh'));
    assert.ok(!result.includes('!`'));
  });

  it('replaces "@file" reference (path/to/file.ext) with neutral "see file"', () => {
    const result = cleanAndNeutralize('Execute @scripts/build.sh');
    assert.ok(result.includes('(see scripts/build.sh)'));
    assert.ok(!result.includes('@scripts'));
  });

  it('replaces "@file" reference with directory and extension like @references/notes.md', () => {
    const result = cleanAndNeutralize('See @references/notes.md for details');
    assert.ok(result.includes('(see references/notes.md)'));
    assert.ok(!result.includes('@references/notes.md'));
  });

  it('does NOT replace bare @filename without directory separator', () => {
    const input = 'Review @package.json and @tsconfig.json';
    assert.strictEqual(cleanAndNeutralize(input), input);
  });

  it('does NOT replace @-prefixed email addresses', () => {
    const input = 'Contact user@example.com for access';
    assert.strictEqual(cleanAndNeutralize(input), input);
  });

  it('does NOT replace scoped npm package names with @ prefix', () => {
    const input = 'npm install @scope/package-name';
    assert.strictEqual(cleanAndNeutralize(input), input);
  });

  it('does NOT replace @version tag annotations', () => {
    const input = 'Use the @latest tag for releases, tag @v1.2.3 for stable';
    assert.strictEqual(cleanAndNeutralize(input), input);
  });

  it('does NOT replace @model references in AI context', () => {
    const input = 'Invoke the @claude-3.5 model for analysis';
    assert.strictEqual(cleanAndNeutralize(input), input);
  });

  it('does NOT replace !`cmd` with backtick-neutralized @ references', () => {
    const input = 'Run !`ls @path` to list files';
    const result = cleanAndNeutralize(input);
    // The !`cmd` pattern should be rewritten, but the @path inside should not become (see path)
    assert.ok(result.includes('@path') || !result.includes('(see path)'));
  });

  it('replaces bare CLAUDE_PLUGIN_ROOT (non-$, non-${}) with PLUGIN_ROOT', () => {
    const result = cleanAndNeutralize("os.environ.get('CLAUDE_PLUGIN_ROOT')");
    assert.ok(result.includes("os.environ.get('PLUGIN_ROOT')"));
    assert.ok(!result.includes('CLAUDE_PLUGIN_ROOT'));
  });

  it('neutralizes multiple new patterns in same content', () => {
    const input = 'Run cc --plugin-dir and check /tmp/claude/ for debug logs';
    const result = cleanAndNeutralize(input);
    assert.ok(!result.includes('cc --plugin-dir'));
    assert.ok(!result.includes('/tmp/claude/'));
    assert.ok(result.includes('agent --plugin-dir'));
    assert.ok(result.includes('/tmp/agent/'));
  });

  it('does not match cc --plugin-dir partially', () => {
    const result = cleanAndNeutralize('some-cc --plugin-dir-other');
    // Should only match exact "cc --plugin-dir" pattern
    assert.strictEqual(result, 'some-cc --plugin-dir-other');
  });

  it('does not match !` without closing backtick', () => {
    const input = 'Not a complete !`pattern';
    const result = cleanAndNeutralize(input);
    assert.strictEqual(result, input);
  });

  it('preserves order of overlapping patterns — CLAUDE_PLUGIN_ROOT $ form first', () => {
    // $CLAUDE_PLUGIN_ROOT should be matched before bare CLAUDE_PLUGIN_ROOT
    const result = cleanAndNeutralize('$CLAUDE_PLUGIN_ROOT and CLAUDE_PLUGIN_ROOT');
    assert.ok(!result.includes('CLAUDE_PLUGIN_ROOT'));
    // Both should be PLUGIN_ROOT now
    assert.strictEqual(result, 'PLUGIN_ROOT and PLUGIN_ROOT');
  });

  it('replacements work on claude-code skill text references', () => {
    const result = cleanAndNeutralize('Use cc --plugin-dir to load plugins.');
    assert.ok(result.includes('agent --plugin-dir'));
  });
});

describe('model-tier neutralization', () => {
  it('replaces "haiku agent" with "fast lightweight agent"', () => {
    const result = cleanAndNeutralize('Launch a haiku agent to check');
    assert.ok(result.includes('fast lightweight agent'));
    assert.ok(!result.includes('haiku agent'));
  });

  it('replaces "sonnet agent" with "standard agent"', () => {
    const result = cleanAndNeutralize('Launch a sonnet agent to summarize');
    assert.ok(result.includes('standard agent'));
    assert.ok(!result.includes('sonnet agent'));
  });

  it('replaces "sonnet agents" (plural) with "standard agents"', () => {
    const result = cleanAndNeutralize('CLAUDE.md compliance sonnet agents');
    assert.ok(result.includes('standard agents'));
    assert.ok(!result.includes('sonnet agents'));
  });

  it('replaces "Opus bug agent" with "high-capability agent"', () => {
    const result = cleanAndNeutralize('Agent 3: Opus bug agent for scanning');
    assert.ok(result.includes('high-capability agent'));
    assert.ok(!result.includes('Opus bug agent'));
  });

  it('replaces "Opus agent" with "high-capability agent"', () => {
    const result = cleanAndNeutralize('Use Opus agent for complex analysis');
    assert.ok(result.includes('high-capability agent'));
    assert.ok(!result.includes('Opus agent'));
  });

  it('replaces "Opus subagents" with "high-capability subagents"', () => {
    const result = cleanAndNeutralize('Use Opus subagents for validation');
    assert.ok(result.includes('high-capability subagents'));
    assert.ok(!result.includes('Opus subagents'));
  });

  it('replaces "model: sonnet" to "model: standard" in YAML frontmatter', () => {
    const result = cleanAndNeutralize('model: sonnet');
    assert.strictEqual(result, 'model: standard');
  });

  it('does NOT replace API model IDs like "claude-opus-4-7"', () => {
    const input = 'SECURITY_REVIEW_MODEL=claude-opus-4-7';
    const result = cleanAndNeutralize(input);
    assert.ok(result.includes('claude-opus-4-7'));
  });

  it('does NOT replace "haiku" in model version strings', () => {
    const input = 'claude-haiku-4-5-20251001';
    const result = cleanAndNeutralize(input);
    assert.ok(result.includes('haiku'));
  });

  it('handles case-insensitive "Haiku agent" replacement', () => {
    const result = cleanAndNeutralize('Launch a Haiku agent');
    assert.ok(result.includes('fast lightweight agent'));
    assert.ok(!result.includes('Haiku agent'));
  });

  it('handles case-insensitive "Sonnet agents" replacement', () => {
    const result = cleanAndNeutralize('CLAUDE.md compliance Sonnet agents');
    assert.ok(result.includes('standard agents'));
    assert.ok(!result.includes('Sonnet agents'));
  });

  it('replaces "model: haiku" with "model: fast"', () => {
    const result = cleanAndNeutralize('model: haiku');
    assert.strictEqual(result, 'model: fast');
  });

  it('replaces "model: opus" with "model: high-capability"', () => {
    const result = cleanAndNeutralize('model: opus');
    assert.strictEqual(result, 'model: high-capability');
  });

  it('does NOT replace "model: claude-opus-4-7" (API ID)', () => {
    const input = 'model: claude-opus-4-7';
    const result = cleanAndNeutralize(input);
    assert.ok(result.includes('claude-opus-4-7'));
  });

  it('replaces backtick-quoted `haiku` with `fast`', () => {
    const result = cleanAndNeutralize('Use `haiku` for simple tasks');
    assert.ok(result.includes('`fast`'));
    assert.ok(!result.includes('`haiku`'));
  });

  it('replaces backtick-quoted `sonnet` with `standard`', () => {
    const result = cleanAndNeutralize('Use `sonnet` for balanced workflows');
    assert.ok(result.includes('`standard`'));
    assert.ok(!result.includes('`sonnet`'));
  });

  it('replaces backtick-quoted `opus` with `high-capability`', () => {
    const result = cleanAndNeutralize('Use `opus` for complex analysis');
    assert.ok(result.includes('`high-capability`'));
    assert.ok(!result.includes('`opus`'));
  });

  it('does NOT replace backtick-quoted API IDs like `claude-opus-4-7`', () => {
    const input = 'Set SECURITY_REVIEW_MODEL to `claude-opus-4-7`';
    const result = cleanAndNeutralize(input);
    assert.ok(result.includes('claude-opus-4-7'));
  });

  it('replaces "inherit/sonnet/opus/haiku" enum with "inherit/standard/high-capability/fast"', () => {
    const result = cleanAndNeutralize('model: inherit/sonnet/opus/haiku');
    assert.ok(result.includes('inherit/standard/high-capability/fast'));
    assert.ok(!result.includes('sonnet'));
  });

  it('replaces "sonnet, opus, haiku" enum with "standard, high-capability, fast"', () => {
    const result = cleanAndNeutralize('Valid values: sonnet, opus, haiku');
    assert.ok(result.includes('standard, high-capability, fast'));
  });

  it('replaces "Opus 4.7" with "high-capability model"', () => {
    const result = cleanAndNeutralize('Uses Opus 4.7 by default');
    assert.ok(result.includes('high-capability model'));
    assert.ok(!result.includes('Opus 4.7'));
  });

  it('replaces "Sonnet 4.5" with "standard model"', () => {
    const result = cleanAndNeutralize('Migrate from Sonnet 4.5');
    assert.ok(result.includes('standard model'));
    assert.ok(!result.includes('Sonnet 4.5'));
  });

  it('replaces "Haiku 4.5" with "fast model"', () => {
    const result = cleanAndNeutralize('Do NOT migrate Haiku 4.5 models');
    assert.ok(result.includes('fast model'));
    assert.ok(!result.includes('Haiku 4.5'));
  });

  it('does NOT replace API IDs like "claude-opus-4-7"', () => {
    const input = 'SECURITY_REVIEW_MODEL=claude-opus-4-7';
    const result = cleanAndNeutralize(input);
    assert.ok(result.includes('claude-opus-4-7'));
  });

  it('does NOT replace Bedrock IDs like "anthropic.agent-opus-4-7"', () => {
    const input = 'anthropic.agent-opus-4-7-v1:0';
    const result = cleanAndNeutralize(input);
    assert.ok(result.includes('anthropic.agent-opus-4-7'));
  });

  it('skips model-tier patterns when skillName is exempted', () => {
    const content = 'Migrate from Opus 4.5 to Opus 4.7. Use `sonnet` for balanced work.';
    const result = cleanAndNeutralize(content, { skillName: 'claude-opus-4-5-migration' });
    // Model-tier patterns should be skipped for exempt skills
    assert.ok(result.includes('Opus 4.5'));
    assert.ok(result.includes('Opus 4.7'));
    assert.ok(result.includes('`sonnet`'));
  });

  it('applies model-tier patterns for non-exempt skills', () => {
    const content = 'Migrate from Opus 4.5 to Opus 4.7. Use `sonnet` for balanced work.';
    const result = cleanAndNeutralize(content, { skillName: 'code-review' });
    assert.ok(!result.includes('Opus 4.5'));
    assert.ok(!result.includes('`sonnet`'));
  });

  it('applies model-tier patterns when no skillName is provided (backward compat)', () => {
    const content = 'Use `sonnet` for balanced work.';
    const result = cleanAndNeutralize(content);
    assert.ok(result.includes('`standard`'));
    assert.ok(!result.includes('`sonnet`'));
  });
});

describe('findNeutralityViolations with model-tier patterns', () => {
  const { findNeutralityViolations } = require('../../lib/platform');

  it('detects model-tier violations in non-exempt skill', () => {
    const content = 'Launch a sonnet agent and use `opus` for analysis.';
    const issues = findNeutralityViolations(content, { skillName: 'code-review' });
    assert.ok(issues.some(i => i.includes('sonnet agent')));
    assert.ok(issues.some(i => i.includes('`opus`')));
  });

  it('skips model-tier violations for exempt skill', () => {
    const content = 'Migrate from Opus 4.5 to Opus 4.7. Use `sonnet` for balanced work.';
    const issues = findNeutralityViolations(content, { skillName: 'claude-opus-4-5-migration' });
    // Should NOT flag model-tier violations for exempt skills
    assert.ok(!issues.some(i => i.includes('model tier')));
  });

  it('detects model-tier violations when no skillName provided (backward compat)', () => {
    const content = 'Launch a sonnet agent.';
    const issues = findNeutralityViolations(content);
    assert.ok(issues.some(i => i.includes('sonnet agent')));
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
