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
});
