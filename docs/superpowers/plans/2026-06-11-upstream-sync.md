# Upstream Sync Automation Implementation Plan

**Required sub-skill:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`

**Goal:** Automate syncing upstream anthropics/claude-code changes into claude-code-unplugged via a GitHub Actions workflow

**Architecture:** Single GitHub Actions workflow clones upstream, runs 5-stage extraction pipeline to temp dir, validates, diffs, creates PR. Script changes add `--output` flag to `generate-manifest.js`, deterministic sorting, and path traversal sanitization in `files.js`.

**Tech Stack:** GitHub Actions (YAML), Node.js 20, bash, jq, rsync, gh CLI

---

## File Structure

| File | Action | Description |
|---|---|---|
| `.github/workflows/sync-upstream.yml` | Create | GitHub Actions workflow |
| `scripts/generate-manifest.js` | Modify | Add `--output` flag, deterministic sorting |
| `scripts/lib/files.js` | Modify | Add path traversal sanitization |
| `scripts/test/generate-manifest.test.js` | Modify | Add tests for `--output` and sorting |
| `scripts/test/lib/files.test.js` | Modify | Add tests for path traversal |

---

## Task 1: Path Traversal Sanitization in files.js

**Files:** `scripts/lib/files.js`, `scripts/test/lib/files.test.js`

### Step 1: Write failing tests

Add 3 new test cases to `scripts/test/lib/files.test.js`:

- `'copyRecursiveSync rejects directory names with path traversal'` — creates a dir named `.._evil` with `SKILL.md`, asserts `copyRecursiveSync` throws `/path traversal/`
- `'copyRecursiveSync rejects directory names containing slash'` — tests `sanitizePath('foo/bar')` throws `/path traversal/`
- `'sanitizePath allows valid directory names'` — tests `sanitizePath('my-skill')` returns `'my-skill'` and `sanitizePath('skill-name-123')` returns `'skill-name-123'`

### Step 2: Run tests (expect FAIL)

```bash
node --test scripts/test/lib/files.test.js
```

### Step 3: Implement

Add `sanitizePath` function to `scripts/lib/files.js` after `TEXT_EXTENSIONS` constant:

```javascript
function sanitizePath(name) {
  if (name.includes('..') || name.includes('/')) {
    throw new Error(`path traversal detected: "${name}" contains '..' or '/'`);
  }
  return name;
}
```

Add `sanitizePath` call inside `copyRecursiveSync`'s `readdirSync` forEach:

```javascript
fs.readdirSync(src).forEach((childItemName) => {
  sanitizePath(childItemName);
  copyRecursiveSync(
    path.join(src, childItemName),
    path.join(dest, childItemName),
    opts
  );
});
```

Add `sanitizePath` to module.exports:

```javascript
module.exports = { copyRecursiveSync, ensureDir, sanitizePath };
```

### Step 4: Run tests (expect PASS)

```bash
node --test scripts/test/lib/files.test.js
```

### Step 5: Run all tests (expect all PASS)

```bash
node --test scripts/test/**/*.test.js
```

### Step 6: Commit

```bash
git add scripts/lib/files.js scripts/test/lib/files.test.js && git commit -m "feat: add path traversal sanitization to files.js"
```

---

## Task 2: --output Flag and Deterministic Sorting in generate-manifest.js

**Files:** `scripts/generate-manifest.js`, `scripts/test/generate-manifest.test.js`

### Step 1: Write failing tests

Add 3 new test cases to `scripts/test/generate-manifest.test.js`:

- `'writes manifest to custom output path via --output flag'` — creates 2 skills, runs with `--output` flag pointing to `custom-manifest.json`, asserts the file exists at custom path with correct content
- `'sorts skills alphabetically by name in manifest output'` — creates `zebra-skill`, `alpha-skill`, `middle-skill` (out of order), runs manifest, asserts names are `['alpha-skill', 'middle-skill', 'zebra-skill']`
- `'default output path remains unchanged when --output is not used'` — creates 1 skill, runs without `--output`, asserts `skills.json` exists at `ORIG_JSON`

### Step 2: Run tests (expect FAIL)

```bash
node --test scripts/test/generate-manifest.test.js
```

### Step 3: Implement

Modify top of `scripts/generate-manifest.js`:

Add CLI arg parsing for `--output`/`-o` flag before existing constants. Replace hardcoded `manifestPath` with `const manifestPath = outputPath || path.resolve(__dirname, '../skills.json');`. Add `.sort()` to the skills `readdirSync` filter chain.

The new top of the file should be:

```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { parseFrontmatter, stripFrontmatter } = require('./lib/frontmatter');

// Parse CLI arguments
const args = process.argv.slice(2);
let outputPath = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--output' || args[i] === '-o') {
    outputPath = args[++i];
  }
}

const skillsDir = process.env.SKILLS_DIR || path.resolve(__dirname, '../skills');
const manifestPath = outputPath || path.resolve(__dirname, '../skills.json');
const defaultSkillVersion = process.env.SKILL_VERSION || '0.1.0';
const skipDirs = new Set(['.git', '.full-review', 'openspec', 'scripts', 'node_modules']);
const skills = fs.readdirSync(skillsDir).filter(d => {
  if (d.startsWith('.')) return false;
  if (skipDirs.has(d)) return false;
  const stat = fs.statSync(path.join(skillsDir, d));
  if (!stat.isDirectory()) return false;
  return fs.existsSync(path.join(skillsDir, d, 'SKILL.md'));
}).sort();
```

### Step 4: Run tests (expect PASS)

```bash
node --test scripts/test/generate-manifest.test.js
```

### Step 5: Run all tests (expect all PASS)

```bash
node --test scripts/test/**/*.test.js
```

### Step 6: Commit

```bash
git add scripts/generate-manifest.js scripts/test/generate-manifest.test.js && git commit -m "feat: add --output flag and deterministic sorting to generate-manifest.js"
```

---

## Task 3: GitHub Actions Workflow

**Files:** `.github/workflows/sync-upstream.yml` (Create)

### Step 1: Create workflow file

Create `.github/workflows/sync-upstream.yml` with the following content:

```yaml
name: Sync Upstream

on:
  schedule:
    # Weekly: Monday 00:00 UTC
    - cron: '0 0 * * 1'
  workflow_dispatch:
    inputs:
      force:
        description: 'Skip early-exit check and force re-extraction'
        required: false
        default: false
        type: boolean

permissions:
  contents: write
  pull-requests: write
  issues: write

concurrency:
  group: upstream-sync
  cancel-in-progress: false

jobs:
  sync:
    if: github.repository == 'mhenke/claude-code-unplugged'
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          ref: main
          fetch-depth: 1

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Check upstream
        id: check
        run: |
          CURRENT=$(jq -r '.provenance.sourceCommit' skills.json)
          UPSTREAM_LINE=$(git ls-remote https://github.com/anthropics/claude-code.git HEAD)
          FULL_HASH=$(echo "$UPSTREAM_LINE" | awk '{print $1}')
          SHORT_HASH=$(echo "$FULL_HASH" | cut -c1-7)
          echo "current=$CURRENT"
          echo "upstream=$SHORT_HASH"
          echo "upstream_short=$SHORT_HASH" >> "$GITHUB_OUTPUT"
          echo "upstream_full=$FULL_HASH" >> "$GITHUB_OUTPUT"
          if [ "$CURRENT" = "$SHORT_HASH" ] && [ "${{ inputs.force }}" != "true" ]; then
            echo "up-to-date=true" >> "$GITHUB_OUTPUT"
            echo "Up to date with $CURRENT"
          else
            echo "up-to-date=false" >> "$GITHUB_OUTPUT"
            echo "Upstream changed: $CURRENT → $SHORT_HASH"
          fi

      - name: Clone upstream repository
        if: steps.check.outputs.up-to-date != 'true'
        run: |
          git clone --depth 1 https://github.com/anthropics/claude-code.git /tmp/upstream

      - name: Create temp working directory
        if: steps.check.outputs.up-to-date != 'true'
        run: |
          mkdir -p ${{ runner.temp }}/sync-output/skills

      - name: Run extraction pipeline
        if: steps.check.outputs.up-to-date != 'true'
        env:
          SOURCE_REPOSITORY: https://github.com/anthropics/claude-code.git
          SOURCE_COMMIT: ${{ steps.check.outputs.upstream_full }}
        run: |
          node scripts/extract.js \
            --source /tmp/upstream \
            --target ${{ runner.temp }}/sync-output

      - name: Verify extraction produced skills
        if: steps.check.outputs.up-to-date != 'true'
        run: |
          SKILL_COUNT=$(find ${{ runner.temp }}/sync-output/skills -name "SKILL.md" | wc -l)
          echo "Extracted $SKILL_COUNT skills"
          if [ "$SKILL_COUNT" -lt "20" ]; then
            echo "ERROR: Expected at least 20 skills, got $SKILL_COUNT"
            exit 1
          fi

      - name: Generate manifest for extracted skills
        if: steps.check.outputs.up-to-date != 'true'
        env:
          SKILLS_DIR: ${{ runner.temp }}/sync-output/skills
          SOURCE_REPOSITORY: https://github.com/anthropics/claude-code.git
          SOURCE_COMMIT: ${{ steps.check.outputs.upstream_full }}
        run: |
          node scripts/generate-manifest.js --output ${{ runner.temp }}/sync-output/skills.json

      - name: Validate extracted skills
        if: steps.check.outputs.up-to-date != 'true'
        env:
          SKILLS_DIR: ${{ runner.temp }}/sync-output/skills
        run: |
          node scripts/validate.js

      - name: Diff extracted output
        id: diff
        if: steps.check.outputs.up-to-date != 'true'
        run: |
          diff -ru skills/ ${{ runner.temp }}/sync-output/skills/ > diff-output.txt || true
          diff -u skills.json ${{ runner.temp }}/sync-output/skills.json >> diff-output.txt || true
          if [ -s diff-output.txt ]; then
            echo "has-changes=true" >> "$GITHUB_OUTPUT"
          else
            echo "has-changes=false" >> "$GITHUB_OUTPUT"
            echo "No changes detected after extraction"
          fi

      - name: List deleted skills
        id: deleted
        if: steps.check.outputs.up-to-date != 'true' && steps.diff.outputs.has-changes == 'true'
        run: |
          comm -23 <(ls skills/ | sort) <(ls ${{ runner.temp }}/sync-output/skills/ | sort) > deleted-skills.txt || true
          echo "Deleted: $(cat deleted-skills.txt | tr '\n' ' ')"

      - name: Check for existing PR
        id: existing-pr
        if: steps.check.outputs.up-to-date != 'true' && steps.diff.outputs.has-changes == 'true'
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          PR_NUMBER=$(gh pr list --head "sync/upstream-${{ steps.check.outputs.upstream_short }}" --json number --jq '.[0].number' || echo "none")
          echo "pr_number=$PR_NUMBER" >> "$GITHUB_OUTPUT"
          if [ "$PR_NUMBER" != "none" ] && [ -n "$PR_NUMBER" ]; then
            echo "Found existing PR #$PR_NUMBER, will update"
          else
            echo "No existing PR found, will create new one"
          fi

      - name: Create or update pull request
        if: steps.check.outputs.up-to-date != 'true' && steps.diff.outputs.has-changes == 'true'
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          # Git config
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

          # Switch to dedicated branch
          SHORT_HASH="${{ steps.check.outputs.upstream_short }}"
          git checkout -B "sync/upstream-${SHORT_HASH}"

          # Copy extracted skills into repo
          rsync -a --delete ${{ runner.temp }}/sync-output/skills/ skills/
          cp ${{ runner.temp }}/sync-output/skills.json skills.json

          # Stage all changes (scoped paths only)
          git add -A skills/ skills.json

          # Check if there are any changes
          if git diff --cached --quiet; then
            echo "No changes to commit"
            exit 0
          fi

          # Commit and push
          git commit -m "chore: sync upstream claude-code ${SHORT_HASH}"
          git push origin "sync/upstream-${SHORT_HASH}"

          # Build PR body with source link, changes, new/removed skills, and pipeline status
          PR_BODY="## Upstream Sync

          Syncing upstream [anthropics/claude-code@${{ steps.check.outputs.upstream_full }}](https://github.com/anthropics/claude-code/commit/${{ steps.check.outputs.upstream_full }}) into \`claude-code-unplugged\`.

          ### Changed Skills
          \`\`\`
          $(cat diff-output.txt 2>/dev/null | head -50)
          \`\`\`

          ### Removed Skills
          $(cat deleted-skills.txt 2>/dev/null | sed 's/^/- /')

          ### Pipeline Status
          - Extraction: ✅ Complete
          - Validation: ✅ Passed
          - Manifest: ✅ Regenerated

          > This PR was automatically generated by the \`Sync Upstream\` workflow."

          # Check for existing PR
          PR_NUMBER="${{ steps.existing-pr.outputs.pr_number }}"
          if [ "$PR_NUMBER" != "none" ] && [ -n "$PR_NUMBER" ]; then
            gh pr edit "$PR_NUMBER" --body "$PR_BODY"
          else
            gh pr create \
              --base main \
              --head "sync/upstream-${SHORT_HASH}" \
              --title "chore: sync upstream claude-code ${SHORT_HASH}" \
              --body "$PR_BODY"
          fi

      - name: Create failure issue
        if: failure()
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          gh issue create \
            --title "upstream-sync: failure — ${{ steps.check.outputs.upstream_short }}" \
            --label "sync,upstream" \
            --body "See workflow run: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
```

### Step 2: Validate YAML syntax

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/sync-upstream.yml')); print('YAML is valid')"
```

### Step 3: Verify workflow matches spec

Checklist:

- [x] `on: schedule` — weekly Monday 00:00 UTC via `cron: '0 0 * * 1'`
- [x] `on: workflow_dispatch` — with `force` boolean input, description "Skip early-exit check and force re-extraction"
- [x] `permissions: contents: write, pull-requests: write, issues: write`
- [x] `concurrency: group: upstream-sync, cancel-in-progress: false`
- [x] `if: github.repository == 'mhenke/claude-code-unplugged'`
- [x] Checkout — `ref: main`, `fetch-depth: 1`
- [x] Setup Node.js — version 20
- [x] Check upstream — read `sourceCommit` from `skills.json` via `jq`, compare short hashes from `git ls-remote`, check `inputs.force` to bypass, set `up-to-date` step output
- [x] Clone upstream — gated by `if: steps.check.outputs.up-to-date != 'true'`
- [x] Create temp dir — `${{ runner.temp }}/sync-output/skills`, gated by check output
- [x] Run extract pipeline — `SOURCE_REPOSITORY` = full URL `https://github.com/anthropics/claude-code.git`, `SOURCE_COMMIT` = full hash, gated by check output
- [x] Verify skill count — `>= 20` guard, gated by check output
- [x] Generate manifest — `SKILLS_DIR` = `${{ runner.temp }}/sync-output/skills`, `--output` to `skills.json` in same dir, gated by check output
- [x] Validate — `SKILLS_DIR` = skills subdirectory, gated by check output
- [x] Diff — `diff -ru skills/` + `diff -u skills.json`, `[ -s diff-output.txt ]` for `has-changes` output, gated by check output
- [x] List deleted skills — `comm -23 <(ls skills/ | sort) <(ls ${{ runner.temp }}/sync-output/skills/ | sort)` (compares skills directories), gated by check and diff outputs
- [x] Check existing PR — `gh pr list --head "sync/upstream-${SHORT_HASH}"`, gated by check and diff outputs
- [x] Create/update PR — `git checkout -B sync/upstream-${SHORT_HASH}`, `rsync --delete`, `git add -A skills/ skills.json`, `git diff --cached --quiet` guard, `git commit -m "chore: sync upstream claude-code ${SHORT_HASH}"`, `gh pr create` with matching title, gated by check and diff outputs
- [x] Create failure issue — `if: failure()` with `gh issue create`, title `upstream-sync: failure — ${SHORT_HASH}`, labels `sync,upstream`

### Step 4: Commit

```bash
git add .github/workflows/sync-upstream.yml && git commit -m "ci: add upstream sync GitHub Actions workflow"
```

---

## Task 4: Regenerate skills.json and Final Validation

### Step 1: Regenerate manifest

```bash
node scripts/generate-manifest.js
```

### Step 2: Validate all skills

```bash
node scripts/validate.js
```

Expected: all 22 skills pass.

### Step 3: Run all tests

```bash
node --test scripts/test/**/*.test.js
```

Expected: all PASS.

### Step 4: Commit

```bash
git add skills.json && git commit -m "chore: regenerate skills.json with deterministic sorting"
```
