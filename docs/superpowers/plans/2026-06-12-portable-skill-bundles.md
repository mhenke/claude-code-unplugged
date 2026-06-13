# Portable Skill Bundles Implementation Plan

**Goal:** Make skill bundles portable and compatible with `npx skills add` by expanding platform-neutrality transformation, adding provenance tracking to `skills-lock.json`, bundling hook artifacts properly, and ensuring gate consistency across all 22 skills.

**Architecture:** Single-source-of-truth neutralization in platform.js; new `lockfile.js` module for build-time hashing and provenance; pipeline unchanged (5-stage assembly order); v2 skills-lock.json adds per-skill hashes and staleness metadata.

**Tech Stack:** Node.js 20 (CommonJS), node:test, node:crypto for hashing

**Intro Note — `npx skills add` compatibility:** All skill directories remain static, ready-to-install artifacts. The extraction pipeline assembles derived skills at build time (not install time). Hook scripts and configs are bundled as executable artifacts with inline documentation explaining platform-specific consumption. No post-install mutation occurs. No invented portable standards (no `SKILL_ROOT`, no `.skills/` dirs).

---

## File Structure

| File | Action | Description |
|---|---|---|---|
| `scripts/lib/platform.js` | Modify | Add 5 new neutralization patterns + `!`cmd`` relocation; `@file` uses whitespace-bound regex |
| `scripts/lib/lockfile.js` | Create | Lock file module: computeHash, generateLockFile, verifyLockStaleness; hashes ALL tracked files per skill |
| `scripts/check-lock-staleness.js` | Create | Standalone CLI for lock staleness check (no upstream extraction needed) |
| `scripts/extract.js` | Modify | Add Step 6 for lock file generation after pipeline |
| `scripts/pipeline/merge-commands.js` | Modify | Remove inline `!`cmd`` regex (moved to platform.js) |
| `scripts/lib/validate-skill.js` | Verify only | Dynamic coverage from platform.js — no changes expected |
| `scripts/lib/gates.js` | Verify only | Gate builder map audit — no changes expected |
| `scripts/pipeline/security-guidance.js` | Verify only | `.claude-plugin` source path already neutralized at copy-time |
| `skills-lock.json` | Modify | Upgrade v1 → v2: all 22 skills + per-file hashes + combinedHash + provenance + staleness metadata |
| `scripts/test/lib/platform.test.js` | Modify | Add 15 test cases (8 positive, 5 negative-scope, 2 edge-case) |
| `scripts/test/lib/gates.test.js` | Modify | Add gate wiring verification tests using real 16 non-gate skills |
| `scripts/test/lib/validate-skill.test.js` | Modify | Add 1 test for dynamic coverage verification |
| `scripts/test/extract.test.js` | Modify | Add lock generation, staleness validation, and CLI tool tests |

---

## Task 1: Expand Neutralization in platform.js (Tests-First)

**Files:** `scripts/lib/platform.js`, `scripts/test/lib/platform.test.js`

### Patterns to Add

| Pattern | Replacement | Example Input | Example Output | Violation Label |
|---|---|---|---|---|
| `cc --plugin-dir` | `agent --plugin-dir` | `cc --plugin-dir /path` | `agent --plugin-dir /path` | references "cc --plugin-dir" (platform-specific CLI) |
| `/tmp/claude/` | `/tmp/agent/` | `/tmp/claude/debug.txt` | `/tmp/agent/debug.txt` | references "/tmp/claude/" (platform-specific temp path) |
| `` !`cmd` `` | `(Retrieve by running `cmd` with bash)` | `` !`bash build.sh` `` | `(Retrieve by running `bash build.sh` with your bash tool)` | contains "!`cmd`" inline command interpolation |
| `` @file `` (whitespace-bound) | `(see file)` | `` @scripts/build.sh `` | `(see scripts/build.sh)` | contains "@file" reference syntax (whitespace-start only) |
| `CLAUDE_PLUGIN_ROOT` bare | `PLUGIN_ROOT` | `os.environ.get('CLAUDE_PLUGIN_ROOT')` | `os.environ.get('PLUGIN_ROOT')` | references "CLAUDE_PLUGIN_ROOT" (platform-specific env var) |

Note: `!`cmd`` and `@file` patterns are wrapped in backtick context in the plan; actual regex targets the raw syntax characters.

### Step 1: Write failing tests

Add these test cases to `scripts/test/lib/platform.test.js` (before the `renamePath` describe block):

```javascript
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

it('replaces "@file" whitespace-start reference with neutral "see file"', () => {
  const result = cleanAndNeutralize('Execute @scripts/build.sh');
  assert.ok(result.includes('(see scripts/build.sh)'));
  assert.ok(!result.includes('@scripts'));
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
```

### Step 2: Run tests (expect FAIL)

```bash
node --test scripts/test/lib/platform.test.js
```

Expected: 8 new failures (positive pattern tests for cc --plugin-dir, /tmp/claude/, !`cmd`, @file, CLAUDE_PLUGIN_ROOT bare, multi-pattern, overlapping order, and claude-code text refs). The 5 negative-scope tests (email, npm scopes, version tags, model refs, !`cmd` with @path) and 2 edge-case tests (partial match, incomplete backtick) should pass even without patterns implemented.

### Step 3: Implement in platform.js

Add these entries to the `PLATFORM_PATTERNS` array in `scripts/lib/platform.js` (before the `SLASH_COMMANDS` const):

```javascript
{ search: /\bcc --plugin-dir\b/g, replacement: 'agent --plugin-dir', detect: /\bcc --plugin-dir\b/, label: 'references "cc --plugin-dir" (platform-specific CLI flag)' },
{ search: /\/tmp\/claude\//g, replacement: '/tmp/agent/', detect: /\/tmp\/claude\//, label: 'references "/tmp/claude/" (platform-specific temp path)' },
// Note: @file pattern uses whitespace-bound start to avoid matching emails (@example.com),
// scoped npm packages (@scope/name), version tags (@v1.2.3), model references (@claude-3.5), etc.
// Negative lookbehind (?<!\S) ensures @ is preceded by whitespace or line start.
{ search: /(?<!\S)@(\S+)/g, replacement: '(see $1)', detect: /(?<!\S)@\S+/, label: 'contains "@file" reference syntax (whitespace-start only)' },
{ search: /\bCLAUDE_PLUGIN_ROOT\b/g, replacement: 'PLUGIN_ROOT', detect: /\bCLAUDE_PLUGIN_ROOT\b/, label: 'references "CLAUDE_PLUGIN_ROOT" (platform-specific env var)' },
```

For the `!`cmd`` pattern, add it as a clean-only pattern (no label — it's already caught by the merge-commands pipeline's detect logic, but now centralized):

```javascript
// Clean-only: inline command interpolation !`cmd` -> bash instruction
{ search: /!`([^`]+)`/g, replacement: '(Retrieve by running `$1` with your bash tool)' },
```

Note on pattern ordering: `CC --plugin-dir` entries go after the existing `claude --` pattern and before the `claude-security-guidance` entry to maintain prioritization of broader `claude --` matches. The bare `CLAUDE_PLUGIN_ROOT` entry must go AFTER the existing `$CLAUDE_PLUGIN_ROOT` and `${CLAUDE_PLUGIN_ROOT}` entries so those are matched first.

The updated `PLATFORM_PATTERNS` array final ordering should be:

```
1. Claude Code → coding assistant
2. hooks.json → hook-config.json
3. ${CLAUDE_PLUGIN_ROOT} → PLUGIN_ROOT
4. $CLAUDE_PLUGIN_ROOT → PLUGIN_ROOT
5. $CLAUDE_PROJECT_DIR → PROJECT_DIR
6. $CLAUDE_ENV_FILE → ENV_FILE
7. $CLAUDE_CODE_REMOTE → CODE_REMOTE
8. .claude/ → .agent/
9. .claude\b → .agent (clean-only)
10. claude-code → coding-assistant
11. claude -- → assistant --
12. claude-security-guidance → security-guidance
13. PLUGIN_ROOT/hooks/ → PLUGIN_ROOT/scripts/
14. cc --plugin-dir → agent --plugin-dir            (NEW)
15. /tmp/claude/ → /tmp/agent/                       (NEW)
16. (?<!\S)@(\S+) → (see $1)                          (NEW, whitespace-bound)
17. CLAUDE_PLUGIN_ROOT → PLUGIN_ROOT                  (NEW, after $ forms)
18. !`...` → bash instruction                          (NEW, clean-only)
```

### Step 4: Run tests (expect PASS)

```bash
node --test scripts/test/lib/platform.test.js
```

Expected: all tests PASS (23 existing + 15 new = 38 tests)

### Step 5: Run all tests

```bash
node --test scripts/test/**/*.test.js
```

### Step 6: Commit

```bash
git add scripts/lib/platform.js scripts/test/lib/platform.test.js && git commit -m "feat: expand platform.js neutralization with 5 new patterns"
```

---

## Task 2: Remove Redundant !`cmd`` from merge-commands Pipeline

**Files:** `scripts/pipeline/merge-commands.js`, `scripts/test/lib/platform.test.js` (already covered)

### Step 1: Remove inline replace from merge-commands.js

In `scripts/pipeline/merge-commands.js`, remove lines 65 and 85:

```javascript
// Remove these two lines (one in commands section, one in agents section):
commandBody = commandBody.replace(/!`([^`]+)`/g, '(Retrieve by running `$1` with your bash tool)');
agentBody = agentBody.replace(/!`([^`]+)`/g, '(Retrieve by running `$1` with your bash tool)');
```

The `!`cmd`` neutralization is now handled by `cleanAndNeutralize()` which is already called by `writeSkillMd()` inside `mergeCommandsAndAgents()` on line 96:

```javascript
writeSkillMd(destSkillDir, config.skill, config.defaultDesc, body);
```

And `writeSkillMd` calls `cleanAndNeutralize` internally before writing:
```javascript
// (from skill-md.js)
content = cleanAndNeutralize(content);
```

So the removal is safe — the neutralization still happens, just in the centralized location.

### Step 2: Run tests

```bash
node --test scripts/test/**/*.test.js
```

Expected: all PASS (no behavior change, just code relocation)

### Step 3: Commit

```bash
git add scripts/pipeline/merge-commands.js && git commit -m "refactor: move !`cmd` neutralization from pipeline to platform.js"
```

---

## Task 3: Validate Dynamic Coverage in validate-skill.js

**Files:** `scripts/lib/validate-skill.js`, `scripts/test/lib/validate-skill.test.js`

### Analysis

`validate-skill.js` already delegates to `findNeutralityViolations(content)` from `platform.js` (line 63-66). Since the new patterns added in Task 1 include `label` fields, they will automatically surface as violations when `validateSkill()` is called. No code changes needed in the validator itself.

### Step 1: Add test to verify dynamic coverage

Add 1 test case to `scripts/test/lib/validate-skill.test.js`:

```javascript
it('detects new portable-bundle neutrality violations via platform.js delegation', () => {
  const content = '---\nname: test-skill\ndescription: Test\n---\n\n' +
    'Use cc --plugin-dir to load plugins. Temp files go in /tmp/claude/.\n' +
    'Run !`bash build.sh` and reference CLAUDE_PLUGIN_ROOT.';
  const result = validateSkill('test-skill', content);
  assert.strictEqual(result.valid, false);
  // Should detect multiple violations from the new patterns
  const violations = result.errors.filter(e => e.includes('Platform-neutrality violation'));
  assert.ok(violations.length >= 3, `Expected >=3 violations, got ${violations.length}: ${violations.join(', ')}`);
  assert.ok(violations.some(v => v.includes('cc --plugin-dir')));
  assert.ok(violations.some(v => v.includes('/tmp/claude/')));
  assert.ok(violations.some(v => v.includes('CLAUDE_PLUGIN_ROOT')));
});
```

Note: `!`cmd`` is clean-only (no label), so it won't generate a violation — that's by design since it's only an interpolation syntax, not a platform-specific reference that should warn users.

### Step 2: Run tests

```bash
node --test scripts/test/lib/validate-skill.test.js
```

Expected: all PASS (13 tests)

### Step 3: Run all tests

```bash
node --test scripts/test/**/*.test.js
```

### Step 4: Commit

```bash
git add scripts/test/lib/validate-skill.test.js && git commit -m "test: add dynamic coverage verification for new neutralization patterns"
```

---

## Task 4: skills-lock.json v2 with Provenance and Staleness Verification

**Files:** `scripts/lib/lockfile.js` (Create), `scripts/extract.js` (Modify), `skills-lock.json` (Modify), `scripts/test/extract.test.js` (Modify)

### Step 1: Add lock file generation + validation tests to extract.test.js

Add to `scripts/test/extract.test.js`:

```javascript
it('generates skills-lock.json with all 22 skills and provenance block', async () => {
  // Run full extraction
  // ...
  // Assert all 22 skills present
  // Assert provenance block has lastExtracted, sourceCommit, stalenessThresholdDays
  // Assert each skill entry has array of file hashes (SKILL.md + scripts/ + examples/ + references/ + manifests)
});

it('validates skills-lock.json staleness against current skills tree', async () => {
  // Run verifyLockStaleness(skillsDir, lockData)
  // Assert returns { stale: boolean, mismatches: [...], missing: [...], extra: [...] }
  // Assert no false positives when lock matches current tree
  // Assert detects changed SKILL.md content
  // Assert detects added/removed artifact files
});

it('detects staleness when lock file is older than threshold', async () => {
  // Set lock with old lastExtracted date
  // Assert verifyLockStaleness returns stale: true
});
```

### Step 2: Run extract tests (expect FAIL if new test added first, or PASS if test added after implementation)

### Step 3: Create lockfile.js

Create `scripts/lib/lockfile.js`:

```javascript
/**
 * Lock file generation for skills extraction provenance.
 * Computes SHA-256 hashes of ALL tracked files per skill directory and generates
 * a v2 skills-lock.json with per-skill provenance metadata.
 * Also provides staleness verification against the current skills tree.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/** File patterns to include in hashing (glob-like, but simple suffix match) */
const TRACKED_PATTERNS = [
  'SKILL.md',
  'scripts/',
  'examples/',
  'references/',
  'manifest.json',
];

/**
 * Determine whether a file within a skill directory should be tracked.
 * @param {string} relativePath - Path relative to skill directory
 * @returns {boolean}
 */
function isTrackedFile(relativePath) {
  return TRACKED_PATTERNS.some(p => {
    if (p.endsWith('/')) {
      return relativePath.startsWith(p) || relativePath === p.slice(0, -1);
    }
    return relativePath === p;
  });
}

/**
 * Recursively list all files in a directory (relative paths).
 * @param {string} dirPath
 * @param {string} [prefix='']
 * @returns {string[]}
 */
function listFilesRecursive(dirPath, prefix = '') {
  const results = [];
  if (!fs.existsSync(dirPath)) return results;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(fullPath, relPath));
    } else {
      results.push(relPath);
    }
  }
  return results;
}

/**
 * Compute SHA-256 hash of a file's contents.
 * @param {string} filePath
 * @returns {string} hex digest
 */
function computeHash(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Generate the full lock file object, hashing ALL tracked files per skill.
 * @param {string} skillsDir - Path to the skills directory
 * @param {object} metadata - { sourceCommit?, sourceRepository?, stalenessThresholdDays? }
 * @returns {object} lock file content
 */
function generateLockFile(skillsDir, metadata = {}) {
  const skills = {};
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .filter(d => fs.existsSync(path.join(skillsDir, d.name, 'SKILL.md')));

  for (const entry of entries) {
    const skillDir = path.join(skillsDir, entry.name);
    const files = listFilesRecursive(skillDir)
      .filter(f => isTrackedFile(f));

    const fileHashes = {};
    for (const relPath of files) {
      fileHashes[relPath] = computeHash(path.join(skillDir, relPath));
    }

    skills[entry.name] = {
      fileHashes,
      // Combined hash of all tracked file hashes (sorted for determinism)
      combinedHash: crypto.createHash('sha256')
        .update(
          Object.entries(fileHashes)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v}`)
            .join('\n'),
          'utf8'
        )
        .digest('hex'),
    };
  }

  return {
    version: 2,
    generated: {
      lastExtracted: new Date().toISOString(),
      sourceCommit: metadata.sourceCommit || null,
      sourceRepository: metadata.sourceRepository || null,
      stalenessThresholdDays: metadata.stalenessThresholdDays || 30,
    },
    skills,
  };
}

/**
 * Verify a lock file against the current skills tree.
 * Returns detailed staleness report.
 * @param {string} skillsDir - Path to the skills directory
 * @param {object} lockData - Parsed skills-lock.json content
 * @returns {{ stale: boolean, mismatches: Array<{skill: string, file: string, expected: string, actual: string}>, missing: string[], extra: string[], thresholdExceeded: boolean }}
 */
function verifyLockStaleness(skillsDir, lockData) {
  const result = {
    stale: false,
    mismatches: [],
    missing: [],
    extra: [],
    thresholdExceeded: false,
  };

  // Check staleness threshold
  if (lockData.generated && lockData.generated.lastExtracted) {
    const extracted = new Date(lockData.generated.lastExtracted);
    const now = new Date();
    const thresholdDays = lockData.generated.stalenessThresholdDays || 30;
    const ageDays = (now - extracted) / (1000 * 60 * 60 * 24);
    if (ageDays > thresholdDays) {
      result.thresholdExceeded = true;
      result.stale = true;
    }
  }

  // Get current skill entries
  const current = generateLockFile(skillsDir, lockData.generated || {});

  // Check for missing skills
  for (const skillName of Object.keys(current.skills)) {
    if (!lockData.skills[skillName]) {
      result.missing.push(skillName);
      result.stale = true;
    }
  }

  // Check for extra skills (in lock but not on disk)
  for (const skillName of Object.keys(lockData.skills)) {
    if (!current.skills[skillName]) {
      result.extra.push(skillName);
      result.stale = true;
    }
  }

  // Check hash mismatches per skill
  for (const skillName of Object.keys(current.skills)) {
    if (!lockData.skills[skillName]) continue;
    const locked = lockData.skills[skillName];
    const curr = current.skills[skillName];

    // Compare combined hashes
    if (locked.combinedHash !== curr.combinedHash) {
      result.stale = true;
    }

    // Per-file hash comparison for detailed reporting
    const lockedFiles = locked.fileHashes || {};
    const currFiles = curr.fileHashes || {};

    for (const [filePath, currHash] of Object.entries(currFiles)) {
      if (lockedFiles[filePath] === undefined) {
        result.mismatches.push({
          skill: skillName,
          file: filePath,
          expected: '(missing)',
          actual: currHash,
        });
      } else if (lockedFiles[filePath] !== currHash) {
        result.mismatches.push({
          skill: skillName,
          file: filePath,
          expected: lockedFiles[filePath],
          actual: currHash,
        });
      }
    }

    for (const filePath of Object.keys(lockedFiles)) {
      if (currFiles[filePath] === undefined) {
        result.mismatches.push({
          skill: skillName,
          file: filePath,
          expected: lockedFiles[filePath],
          actual: '(removed)',
        });
      }
    }
  }

  return result;
}

module.exports = { computeHash, generateLockFile, verifyLockStaleness, isTrackedFile, listFilesRecursive };
```

### Step 4: Add lock file generation step to extract.js

Add after Step 5 (github-management) in `scripts/extract.js`:

```javascript
// -------------------------------------------------------------
// 6. Generate skills-lock.json
// -------------------------------------------------------------
const { generateLockFile } = require('./lib/lockfile');
console.log('\n--- Generating skills-lock.json ---');
const lockData = generateLockFile(skillsDestDir, {
  sourceCommit: process.env.SOURCE_COMMIT || null,
  sourceRepository: process.env.SOURCE_REPOSITORY || null,
  stalenessThresholdDays: 30,
});
const lockPath = path.resolve(cwd, 'skills-lock.json');
fs.writeFileSync(lockPath, JSON.stringify(lockData, null, 2) + '\n', 'utf8');
console.log(`Wrote lock file to ${lockPath}`);
```

Also add `fs` import if not already present (check — line 9 already has `const fs = require('fs')`).

### Step 5: Update skills-lock.json to v2 schema

Replace the current `skills-lock.json` with an auto-generated v2 file (run the updated extract pipeline), or construct the initial version. The v2 schema is:

```json
{
  "version": 2,
  "generated": {
    "lastExtracted": "2026-06-12T00:00:00.000Z",
    "sourceCommit": null,
    "sourceRepository": null,
    "stalenessThresholdDays": 30
  },
  "skills": {
    "agent-development": {
      "fileHashes": {
        "SKILL.md": "<sha256>",
        "scripts/hook-config.json": "<sha256>"
      },
      "combinedHash": "<sha256-of-sorted-file-hashes>"
    },
    "agent-sdk-dev": { "fileHashes": { "SKILL.md": "<sha256>" }, "combinedHash": "<sha256>" },
    // ... all 22 skills
  }
}
```

### Step 6: Run tests

```bash
node --test scripts/test/extract.test.js
```

### Step 7: Add CLI validation script

Create `scripts/check-lock-staleness.js` as a standalone validation entry point that does NOT require upstream extraction:

```javascript
#!/usr/bin/env node
/**
 * CLI validation tool: check skills-lock.json staleness against current skills/ tree.
 * Usage: node scripts/check-lock-staleness.js [--skills-dir <path>] [--lock-file <path>]
 * Exit code 0 = up to date, 1 = stale or error.
 */
const fs = require('fs');
const path = require('path');
const { generateLockFile, verifyLockStaleness } = require('./lib/lockfile');

function main() {
  const args = process.argv.slice(2);
  const skillsDir = args.includes('--skills-dir')
    ? path.resolve(args[args.indexOf('--skills-dir') + 1])
    : path.resolve(__dirname, '..', 'skills');
  const lockPath = args.includes('--lock-file')
    ? path.resolve(args[args.indexOf('--lock-file') + 1])
    : path.resolve(__dirname, '..', 'skills-lock.json');

  if (!fs.existsSync(lockPath)) {
    console.error('ERROR: Lock file not found:', lockPath);
    process.exit(1);
  }

  const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  const result = verifyLockStaleness(skillsDir, lockData);

  if (result.stale) {
    console.error('STALE: skills-lock.json is out of date.');
    if (result.thresholdExceeded) console.error('  - Last extraction exceeds staleness threshold');
    if (result.missing.length) console.error('  - Missing skills:', result.missing.join(', '));
    if (result.extra.length) console.error('  - Extra skills in lock:', result.extra.join(', '));
    if (result.mismatches.length) {
      console.error('  - Hash mismatches:');
      for (const m of result.mismatches.slice(0, 10)) {
        console.error(`      ${m.skill}/${m.file}: expected ${m.expected.slice(0, 12)}... got ${m.actual.slice(0, 12)}...`);
      }
      if (result.mismatches.length > 10) {
        console.error(`      ... and ${result.mismatches.length - 10} more`);
      }
    }
    process.exit(1);
  }

  console.log('OK: skills-lock.json matches current skills/ tree');
  process.exit(0);
}

main();
```

### Step 8: Run extract pipeline to regenerate skills-lock.json

```bash
node scripts/extract.js --source /tmp/upstream --target /tmp/extract-test
```

(Or equivalent — the source repo may not be available. Alternative: run the lock file generator standalone.)

### Step 9: Verify lock file via CLI validation

```bash
node scripts/check-lock-staleness.js
# Expected: exit 0, "OK: skills-lock.json matches current skills/ tree"
```

### Step 10: Add CLI validation test to extract.test.js

```javascript
it('check-lock-staleness CLI reports up-to-date for clean state', async () => {
  const { execSync } = require('child_process');
  const result = execSync('node scripts/check-lock-staleness.js', { encoding: 'utf8' });
  assert.ok(result.includes('OK:'));
});

it('check-lock-staleness CLI reports stale for mismatched lock', async () => {
  const { execSync } = require('child_process');
  // Temporarily write a bad lock file
  const badLock = JSON.parse(fs.readFileSync('skills-lock.json', 'utf8'));
  badLock.skills['agent-development'] = { combinedHash: 'badhash0000000000000000000000000000000000000000000000', fileHashes: {} };
  fs.writeFileSync('/tmp/test-bad-lock.json', JSON.stringify(badLock));
  try {
    execSync('node scripts/check-lock-staleness.js --lock-file /tmp/test-bad-lock.json', { encoding: 'utf8' });
    assert.fail('Should have thrown');
  } catch (e) {
    assert.ok(e.stderr.includes('STALE'));
    assert.ok(e.status === 1);
  } finally {
    if (fs.existsSync('/tmp/test-bad-lock.json')) fs.unlinkSync('/tmp/test-bad-lock.json');
  }
});
```

### Step 11: Commit

```bash
git add scripts/lib/lockfile.js scripts/extract.js scripts/check-lock-staleness.js skills-lock.json scripts/test/extract.test.js && git commit -m "feat: add skills-lock.json v2 with provenance, all-artifact hashing, and staleness verification"
```

---

## Task 5: Gate Consistency Audit + Tests

**Files:** `scripts/lib/gates.js`, `scripts/test/lib/gates.test.js`

### Analysis

Current `GATE_BUILDERS` map:

| Skill | Gate Function |
|---|---|
| `security-guidance` | `securityGate()` — verification_gate with secrets, input_sanitization, paths |
| `commit-commands` | `conventionsGate()` — verification_gate with conventions, correctness |
| `code-review` | `conventionsGate()` — shared (same function) |
| `feature-dev` | `featureDevGate()` — phase_verification |
| `hookify` | `hookifyGate()` — Hookify Cognitive Execution |
| `ralph-wiggum` | `ralphGate()` — Ralph Self-Enforced Cognitive Loop |

Skills WITHOUT gates (16 total, matching current `skills/` tree):

agent-development
agent-sdk-dev
claude-opus-4-5-migration
command-development
explanatory-output-style
frontend-design
github-management
hook-development
learning-output-style
mcp-integration
plugin-dev
plugin-settings
plugin-structure
pr-review-toolkit
skill-development
writing-rules

This is expected — not every skill needs a pre-execution gate. Gates are only for skills that enforce behavior (security, conventions, feature phases, hookify rules, ralph loop). The current coverage is correct.

### Step 1: Write audit test

Add test to `scripts/test/lib/gates.test.js`:

```javascript
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
```

### Step 2: Run tests

```bash
node --test scripts/test/lib/gates.test.js
```

Expected: all PASS (9 tests)

### Step 3: Run all tests

```bash
node --test scripts/test/**/*.test.js
```

### Step 4: Commit

```bash
git add scripts/test/lib/gates.test.js && git commit -m "test: add gate consistency audit and wiring verification"
```

---

## Task 6: Hook Artifact Documentation

**Files:** None created/edited — documentation lives inline in SKILL.md files

### Analysis

Two skills bundle hook artifacts:

1. **hookify/scripts/hook-config.json** — Uses `PLUGIN_ROOT` to reference Python hook scripts (already neutralized by platform.js). The `hooks.json` filename is renamed to `hook-config.json` by `renamePath()`.

2. **ralph-wiggum/scripts/hook-config.json** — Uses `PLUGIN_ROOT` to reference `stop-hook.sh`.

Both are bundled as platform-consumable artifacts. Consumption is platform-specific (user must place in their tool's hooks directory or configure their tool). The existing SKILL.md content in both skills already describes usage — no additional documentation changes needed.

### Step 1: Verify inline documentation is sufficient

Check that:
- `hookify/SKILL.md` mentions hook config files and their purpose
- `ralph-wiggum/SKILL.md` mentions the stop-hook script

If not, add brief inline notes in the relevant SKILL.md sections. Since these are pipeline-assembled files, edits go in the pipeline stage source (`merge-commands.js`'s `body` template).

### Step 2: Verify

```bash
grep -r "hook-config" skills/hookify/SKILL.md skills/ralph-wiggum/SKILL.md
```

### Step 3: Commit (if needed)

Minimal or no commit — this is a documentation verification task.

---

## Task 7: Final Validation and Regeneration

**Files:** `skills.json` (regenerate), all test results

### Step 1: Run full test suite

```bash
node --test scripts/test/**/*.test.js
```

Expected: all PASS (50+ tests across all suites: platform 38, gates 9, validate-skill ~14, extract ~10, plus lib tests)

### Step 2: Validate all skills

```bash
node scripts/validate.js
```

Expected: all 22 skills PASS with no errors

### Step 3: Regenerate manifest

```bash
node scripts/generate-manifest.js
```

### Step 4: Verify manifest is valid JSON

```bash
node -e "JSON.parse(require('fs').readFileSync('skills.json','utf8')); console.log('skills.json is valid JSON')"
```

### Step 5: Verify skills-lock.json is valid

```bash
node -e "const lock = JSON.parse(require('fs').readFileSync('skills-lock.json','utf8')); assert(lock.version === 2); assert(lock.generated); assert(Object.keys(lock.skills).length >= 22); console.log('skills-lock.json is valid v2')"
```

### Step 6: Final commit

```bash
git add skills.json skills-lock.json && git commit -m "chore: regenerate skills.json and skills-lock.json v2"
```

---

## Verification Commands

```bash
# Task 1 — platform.js expanded patterns (15 new test cases)
node --test scripts/test/lib/platform.test.js

# Task 2 — pipeline cleanup
node --test scripts/test/**/*.test.js

# Task 3 — validator dynamic coverage
node --test scripts/test/lib/validate-skill.test.js

# Task 4 — lock file generation + staleness
node scripts/check-lock-staleness.js                      # quick CLI validation
node scripts/check-lock-staleness.js --skills-dir skills --lock-file skills-lock.json  # explicit paths
node scripts/extract.js --source /tmp/upstream --target /tmp/extract-test               # full pipeline

# Task 4 — extract tests (includes lock generation + CLI tests)
node --test scripts/test/extract.test.js

# Task 5 — gate consistency (verifies all 6 gated + 16 non-gated skills)
node --test scripts/test/lib/gates.test.js

# Task 7 — final validation
node scripts/validate.js && node scripts/check-lock-staleness.js && \
  node scripts/generate-manifest.js && node --test scripts/test/**/*.test.js
```

## Handoff to Implementer

This plan covers 7 tasks. Implementation order:

1. **Task 1 (platform.js)** — Most critical. Tests-first. Must add 4 label-bearing patterns + 1 clean-only pattern, with `@file` pattern using whitespace-bound regex `(?<!\S)@(\S+)` to avoid false matches on emails, npm scopes, version tags, and model references. Includes 5 negative-scope tests.
2. **Task 2 (merge-commands)** — Trivial code removal after Task 1. Verifies no behavior change.
3. **Task 3 (validate-skill test)** — Quick test addition. Verifies dynamic delegation works.
4. **Task 4 (lockfile.js)** — New module + extract.js step + CLI validation script. Upgrade skills-lock.json to v2 with per-file hashing of ALL tracked artifacts (SKILL.md, scripts/, examples/, references/, manifests). Includes `verifyLockStaleness()` for staleness detection against current skills tree. New `scripts/check-lock-staleness.js` CLI for standalone validation without upstream extraction. 3 extract test cases (generation, staleness, threshold) + 2 CLI tool tests.
5. **Task 5 (gates test)** — Audit + comprehensive test coverage using the real 16 non-gated skills from the current `skills/` tree. No production code changes.
6. **Task 6 (hook docs)** — Verification task. Check inline docs are sufficient.
7. **Task 7 (validation)** — Regenerate artifacts, run all checks including `check-lock-staleness.js`, commit.

Task order ensures each step builds on the previous one. Tests-first approach throughout.
