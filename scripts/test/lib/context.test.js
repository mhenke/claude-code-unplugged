const { describe, it, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { extractAdditionalContext } = require('../../lib/context');

const TMP_DIR = path.join(os.tmpdir(), 'ccu-test-context-' + crypto.randomUUID());

describe('extract.js extractAdditionalContext', () => {
  after(() => {
    if (fs.existsSync(TMP_DIR)) {
      fs.rmSync(TMP_DIR, { recursive: true, force: true });
    }
  });
  it('returns empty string for nonexistent file', () => {
    const result = extractAdditionalContext('/nonexistent/path/script.sh');
    assert.strictEqual(result, '');
  });

  it('extracts additionalContext from JSON in heredoc', () => {
    fs.mkdirSync(TMP_DIR, { recursive: true });
    const shFile = path.join(TMP_DIR, 'session-start.sh');
    const shContent = `#!/bin/bash\ncat << 'EOF'\n{"hookSpecificOutput":{"additionalContext":"This is extra context"}}\nEOF\n`;
    fs.writeFileSync(shFile, shContent, 'utf8');

    const result = extractAdditionalContext(shFile);
    assert.strictEqual(result, 'This is extra context');

    fs.rmSync(shFile);
  });

  it('returns empty string when heredoc contains invalid JSON', () => {
    fs.mkdirSync(TMP_DIR, { recursive: true });
    const shFile = path.join(TMP_DIR, 'bad-json.sh');
    const shContent = `#!/bin/bash\ncat << 'EOF'\n{not valid json}\nEOF\n`;
    fs.writeFileSync(shFile, shContent, 'utf8');

    const result = extractAdditionalContext(shFile);
    assert.strictEqual(result, '');

    fs.rmSync(shFile);
  });
});
