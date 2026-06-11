# Upstream Sync Automation Design

## Problem

The claude-code-unplugged repo extracts portable skills from the upstream `anthropics/claude-code` repo. Currently, syncing upstream changes is a manual process: clone the upstream repo, run the extraction pipeline, and manually commit changes. This is error-prone and easy to forget.

## Solution

Automate upstream sync via a GitHub Actions workflow that periodically checks for upstream changes, runs the full extraction pipeline, and creates a PR when differences are detected.

## Architecture

### Workflow: `sync-upstream.yml`

A single GitHub Actions workflow in `.github/workflows/` that, in order:

1. **Short-circuits** if upstream HEAD matches `sourceCommit` in current `skills.json`
2. **Clones** the upstream `anthropics/claude-code` public repo (shallow, depth 1)
3. **Runs the full extraction pipeline** to a temp directory
4. **Validates** the extracted output
5. **Runs `npm test`** against the extracted output
6. **Diffs** the validated output against current `skills/` and `skills.json`
7. **Creates a PR** if changes are detected, or **creates an issue** on failure

### Workflow Steps (Detailed)

A. **Fork guard** — Only run on the canonical repo: `if: github.repository == 'mhenke/claude-code-unplugged'`

B. **Concurrency control** — Prevent cron + manual race: `concurrency: { group: upstream-sync, cancel-in-progress: false }`

C. **Checkout current repo** — `actions/checkout@v4` (needed for diffing against existing skills)

D. **Setup Node.js** — `actions/setup-node@v4` with `node-version: '20'`

E. **Early exit** — Read `sourceCommit` from current `skills.json` (e.g., `jq -r '.sourceCommit' skills.json`). Fetch upstream HEAD (`git ls-remote https://github.com/anthropics/claude-code.git HEAD`). If equal, exit 0 with "Up to date with <hash>".

F. **Clone upstream** — `git clone --depth 1 https://github.com/anthropics/claude-code.git <upstream-dir>`

G. **Create temp working directory** — `mkdir -p <tmp-dir>` (satisfies `extract.js` target requirement). Use `${{ runner.temp }}/sync-<hash>` and clean up on completion.

H. **Run extraction pipeline:**
    1. `node scripts/extract.js --source <upstream-dir> --target <tmp-dir>`
    2. Verify extracted skill count ≥ 15 (sanity check). If below threshold, fail with issue.
    3. `SOURCE_COMMIT=<hash> SOURCE_REPOSITORY=anthropics/claude-code node scripts/generate-manifest.js --output <tmp-dir>/skills.json`

I. **Validate** — `SKILLS_DIR=<tmp-dir>/skills node scripts/validate.js`

J. **Run tests** — `npm test` (with `SKILLS_DIR=<tmp-dir>/skills` as needed)

K. **Diff against current** — `diff -ru skills/ <tmp-dir>/skills/` and `diff -u skills.json <tmp-dir>/skills.json`. If no diff, log "up to date" and skip PR.

L. **Check for existing PR** — `gh pr list --head sync/upstream-<short-hash> --json number --jq '.[0].number'`

M. **Create or update PR:**
    1. If PR exists, update branch and skip creation
    2. If no PR exists, create branch, commit, push, and open PR

### Git Operations

All git operations use the checkout of the current repo (not the upstream clone):

1. **Git config** — Before any git write operations:
    ```
    git config user.name "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"
    ```

2. **Branch** — Create or switch to `sync/upstream-<short-hash>`:
    ```
    git checkout -b sync/upstream-<short-hash>
    ```

3. **Stage and commit** — Copy temp output over current files (removing any skills deleted upstream), then commit:
    ```
    rsync -a --delete <tmp-dir>/skills/ skills/
    cp <tmp-dir>/skills.json skills.json
    git add skills/ skills.json
    git commit -m "chore: sync upstream claude-code <short-hash>"
    ```

4. **Push** — `git push origin sync/upstream-<short-hash>`

5. **PR** — Create with detailed body:
    ```
    gh pr create \
      --base main \
      --head sync/upstream-<short-hash> \
      --title "chore: sync upstream claude-code <short-hash>" \
      --body "<pr-body>"
    ```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Trigger | Weekly cron + manual dispatch | Weekly cadence catches changes; dispatch enables on-demand sync |
| PR strategy | Single bundled PR | Keeps review scope manageable; avoids PR sprawl |
| Upstream access | Public repo, no auth | `anthropics/claude-code` is public; no PAT needed |
| Hosting | GitHub Actions | Repo is on GitHub; native integration |
| Diff strategy | Validate first, then diff | Never compare raw upstream — always diff transformed output to guarantee platform-neutrality |
| Validation gate | `validate.js` + `npm test` mandatory | Output must pass both validation and tests before PR creation |
| Early exit | Compare `sourceCommit` against upstream HEAD | Avoids running pipeline when no upstream change exists |

### Branch Strategy

- Sync branches: `sync/upstream-<short-hash>` (e.g., `sync/upstream-a1b2c3d`)
- Target: `main`
- Commit message: `chore: sync upstream claude-code <short-hash>`

Branch name omits the date to enable duplicate PR detection — the hash alone uniquely identifies the upstream commit, so checking for existing PRs by branch head works reliably.

### PR Content

The PR body includes:

- Source commit hash and link (`https://github.com/anthropics/claude-code/commit/<hash>`)
- List of changed, new, and removed skills (generated from diff)
- Pipeline and validation status
- Diff summary

### Error Handling

| Scenario | Action |
|----------|--------|
| Upstream unchanged | Exit 0 with "Up to date with <hash>" (short-circuits) |
| No changes after pipeline | Skip PR creation, log "no changes" |
| Validation fails | Create a GitHub Issue with failure details, skip PR |
| Tests fail | Create a GitHub Issue with test output, skip PR |
| Pipeline fails | Create a GitHub Issue with error logs, skip PR |
| Skill count below threshold | Create a GitHub Issue warning of possible upstream restructuring |
| PR already exists for same commit | Update existing PR branch instead of creating duplicate |

### Issue Creation Template

When an issue is required, create it with:

- **Title:** `upstream-sync: <failure-type> — <short-hash>`
- **Labels:** `sync`, `upstream`
- **Body:**
  ```markdown
  ## Upstream Sync Failure

  **Commit:** anthropics/claude-code@<hash>
  **Workflow Run:** <url>
  **Failure Type:** <validation-fail | test-fail | pipeline-error | low-skill-count>

  ### Details
  <error output or summary>

  ### Next Steps
  - Review the workflow run logs linked above
  - Resolve the issue and trigger manually via `workflow_dispatch`
  ```

### Workflow Permissions

```yaml
permissions:
  contents: write
  pull-requests: write
  issues: write
```

Uses the default `GITHUB_TOKEN`.

## Security Considerations

### Path Traversal Risk

If upstream contains a directory with a malicious name like `../../malicious`, the extraction pipeline could write outside the intended temp tree. Mitigation:

- The workflow extracts to `${{ runner.temp }}`, which is scoped per-job and ephemeral
- Each extraction step writes into `<tmp-dir>/skills/`, and no path escapes from within are possible if downstream code sanitizes directory names
- **Implementation note:** `scripts/lib/files.js` should validate that extracted directories do not contain `..` or path separators. Add a path traversal check as part of Implementation Scope.

### Fork Guard

To prevent forks from running the sync workflow and creating spurious PRs/issues:

```yaml
jobs:
  sync:
    if: github.repository == 'mhenke/claude-code-unplugged'
```

## Implementation Scope

### New Files

1. **`.github/workflows/sync-upstream.yml`** — The full workflow as designed above

### Script Changes

2. **`scripts/generate-manifest.js`** — Add a `--output <path>` flag so the manifest JSON can be written to a temp directory instead of always overwriting the project-level `skills.json`. Default behavior (no flag) remains unchanged.

3. **`scripts/lib/files.js`** — Add path traversal sanitization for directory creation in extraction steps. Reject names containing `..` or `/`.

4. **`scripts/generate-manifest.js`** — Sort skill entries in the manifest output by `name` (or `directory`) for deterministic ordering, eliminating ghost diffs from `readdirSync` nondeterminism across filesystems.

### No New Dependencies

All changes use Node.js built-in APIs. The workflow uses `actions/checkout@v4`, `actions/setup-node@v4`, and standard GitHub Actions tooling.

## Out of Scope

- Auto-merge (PRs require manual review)
- Notification beyond GitHub Issues/PRs
- Syncing specific tags or releases (always syncs latest main)
- Handling merge conflicts automatically (manual resolution required)
