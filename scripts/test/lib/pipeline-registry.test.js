const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { runPipeline } = require('../../lib/pipeline-registry');

describe('pipeline-registry.js', () => {
  it('runs all stages in order and returns completed list', () => {
    const order = [];
    const stages = [
      { name: 'A', fn: () => order.push('A') },
      { name: 'B', fn: () => order.push('B') },
      { name: 'C', fn: () => order.push('C') },
    ];
    const result = runPipeline(stages, '/tmp/src', '/tmp/dest');
    assert.deepStrictEqual(order, ['A', 'B', 'C']);
    assert.deepStrictEqual(result.completed, ['A', 'B', 'C']);
    assert.deepStrictEqual(result.errors, []);
  });

  it('returns empty errors when all stages succeed', () => {
    const stages = [
      { name: 'pass1', fn: () => {} },
      { name: 'pass2', fn: () => {} },
    ];
    const result = runPipeline(stages, '/tmp/src', '/tmp/dest');
    assert.deepStrictEqual(result.errors, []);
    assert.strictEqual(result.completed.length, 2);
  });

  it('accumulates errors from failing stages without aborting', () => {
    const stages = [
      { name: 'pass', fn: () => {} },
      { name: 'fail', fn: () => { throw new Error('boom'); } },
      { name: 'pass2', fn: () => {} },
    ];
    const result = runPipeline(stages, '/tmp/src', '/tmp/dest');
    assert.strictEqual(result.errors.length, 1);
    assert.strictEqual(result.errors[0].stage, 'fail');
    assert.strictEqual(result.completed.length, 2);
  });

  it('includes stage name and error object in error records', () => {
    const stages = [
      { name: 'broken', fn: () => { throw new Error('test error'); } },
    ];
    const result = runPipeline(stages, '/tmp/src', '/tmp/dest');
    assert.strictEqual(result.errors[0].stage, 'broken');
    assert.ok(result.errors[0].error instanceof Error);
    assert.strictEqual(result.errors[0].error.message, 'test error');
  });

  it('handles empty stage array gracefully', () => {
    const result = runPipeline([], '/tmp/src', '/tmp/dest');
    assert.deepStrictEqual(result.errors, []);
    assert.deepStrictEqual(result.completed, []);
  });

  it('passes sourcePath and skillsDestDir to each stage', () => {
    let receivedSrc, receivedDest;
    const stages = [
      { name: 'check', fn: (src, dest) => { receivedSrc = src; receivedDest = dest; } },
    ];
    runPipeline(stages, '/my/source', '/my/dest');
    assert.strictEqual(receivedSrc, '/my/source');
    assert.strictEqual(receivedDest, '/my/dest');
  });
});
