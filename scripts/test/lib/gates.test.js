const { describe, it } = require('node:test');
const assert = require('node:assert');
const { buildGate } = require('../../lib/gates');

describe('gates.js buildGate', () => {
  it('returns security gate for security-guidance', () => {
    const result = buildGate('security-guidance');
    assert.ok(result.includes('verification_gate'));
    assert.ok(result.includes('secrets'));
    assert.ok(result.includes('input_sanitization'));
    assert.ok(result.includes('paths'));
  });

  it('returns conventions gate for commit-commands', () => {
    const result = buildGate('commit-commands');
    assert.ok(result.includes('verification_gate'));
    assert.ok(result.includes('conventions'));
    assert.ok(result.includes('correctness'));
  });

  it('returns conventions gate for code-review (same as commit-commands)', () => {
    const commitGate = buildGate('commit-commands');
    const reviewGate = buildGate('code-review');
    assert.strictEqual(commitGate, reviewGate);
  });

  it('returns feature-dev gate for feature-dev', () => {
    const result = buildGate('feature-dev');
    assert.ok(result.includes('phase_verification'));
    assert.ok(result.includes('criteria_met'));
  });

  it('returns empty string for unknown skill', () => {
    const result = buildGate('unknown-skill');
    assert.strictEqual(result, '');
  });

  it('returns empty string for undefined skill', () => {
    const result = buildGate(undefined);
    assert.strictEqual(result, '');
  });

  it('maps all 6 gate builders to expected skill names', () => {
    const expectedKeys = ['security-guidance', 'commit-commands', 'code-review', 'feature-dev', 'hookify', 'ralph-wiggum'];
    // buildGate returns non-empty string for each
    for (const key of expectedKeys) {
      const result = buildGate(key);
      assert.ok(result.length > 0, `Expected non-empty gate for "${key}"`);
    }
  });

  it('returns distinct gates for hookify vs ralph-wiggum vs security-guidance', () => {
    const hookify = buildGate('hookify');
    const ralph = buildGate('ralph-wiggum');
    const security = buildGate('security-guidance');
    assert.notStrictEqual(hookify, ralph);
    assert.notStrictEqual(security, hookify);
    assert.notStrictEqual(security, ralph);
  });

  it('verifies no accidental GATE_BUILDERS overlap with non-gate skills', () => {
    // These skills should NOT have gates
    const nonGateSkills = [
      'agent-development', 'agent-sdk-dev', 'claude-opus-4-5-migration',
      'command-development', 'explanatory-output-style', 'frontend-design',
      'github-management', 'hook-development', 'learning-output-style',
      'mcp-integration', 'plugin-dev', 'plugin-settings', 'plugin-structure',
      'pr-review-toolkit', 'skill-development', 'writing-rules',
    ];
    for (const skill of nonGateSkills) {
      assert.strictEqual(buildGate(skill), '', `Expected empty gate for "${skill}"`);
    }
  });
});
