# Upstream Sync Automation Design

## Problem

The claude-code-unplugged repo extracts portable skills from the upstream `anthropics/claude-code` repo. Currently, syncing upstream changes is a manual process: clone the upstream repo, run the extraction pipeline, and manually commit changes. This is error-prone and easy to forget.

## Solution

Automate upstream sync via a GitHub Actions workflow that periodically checks for upstream changes, runs the full extraction pipeline, and creates a PR when differences are detected.

## Definitions

Throughout this document:

| Term | Format | Example |
|------|--------|---------|
| `<hash>` | 40-character full SHA | `a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0` |
| `<short-hash>` | 7-character abbreviated SHA | `a1b2c3d` |

The full hash is used for commit links (`https://github.com/.../commit/<hash>`). The short hash is used for branch names (`sync/upstream-<short-hash>`), commit messages, PR titles, and issue references. When comparing upstream HEAD against `skills.json`, the short hash is used because that's what `skills.json` stores.

## System Dependencies

The workflow relies on these tools, all pre-installed on `ubuntu-latest` GitHub Actions runners:

- **`jq`** — JSON querying (for reading `skills.json` fields)
- **`rsync`** — File synchronization with deletion support
- **`gh` CLI** — GitHub API interaction (PR creation, issue creation, PR listing)
- **Node.js 20** — Via `actions/setup-node@v4` (runtime for extraction scripts)

## Architecture

### Workflow: `sync-upstream.yml`

A single GitHub Actions workflow in `.github/workflows/` that, in order:

1. **Short-circuits** if upstream HEAD matches `sourceCommit` in current `skills.json` (via step output gating)
2. **Clones** the upstream `anthropics/claude-code` public repo (shallow, depth 1)
3. **Runs the full extraction pipeline** to a temp directory
4. **Validates** the extracted output
5. **Diffs** the validated output against current `skills/` and `skills.json`
6. **Lists deleted skills** before overwriting
7. **Creates a PR** if changes are detected, or **creates an issue** on failure

### Trigger

```yaml
on:
  schedule:
    - cron: '0 0 * * 1'  # Weekly: Monday 00:00 UTC
  workflow_dispatch:
    inputs:
      force:
        description: 'Skip early-exit check and force re-extraction'
        type: boolean
        required: false
        default: false
```

### Workflow Permissions

```yaml
permissions:
  contents: write
  pull-requests: write
  issues: write
```

Uses the default `GITHUB_TOKEN`.

### Workflow Steps (Detailed)

A. **Fork guard** — Only run on the canonical repo: `if: github.repository == 'mhenke/claude-code-unplugged'`

B. **Concurrency control** — Prevent cron + manual race: `concurrency: { group: upstream-sync, cancel-in-progress: false }`

C. **Checkout current repo** — `actions/checkout@v4` with `ref: main` (needed for diffing against existing skills; detached HEAD prevents branch operations otherwise)

D. **Setup Node.js** — `actions/setup-node@v4` with `node-version: '20'`

E. **Check upstream (early exit)** — This step produces an output `up-to-date` used to gate all subsequent steps:

    ```yaml
    - name: Check upstream
      id: check
      run: |
        CURRENT=$(jq -r '.provenance.sourceCommit' skills.json)
        UPSTREAM=$(git ls-remote https://github.com/anthropics/claude-code.git HEAD | cut -c1-7)
        echo "current=$CURRENT"
        echo "upstream=$UPSTREAM"
        if [ "$CURRENT" = "$UPSTREAM" ] && [ "${{ inputs.force }}" != "true" ]; then
          echo "up-to-date=true" >> "$GITHUB_OUTPUT"
          echo "Up to date with $CURRENT"
        else
          echo "up-to-date=false" >> "$GITHUB_OUTPUT"
          echo "Upstream changed: $CURRENT → $UPSTREAM"
        fi
    ```

    Note: The `force` input (from `workflow_dispatch`) bypasses the equality check, forcing re-extraction even for the same hash.

F. **Clone upstream** — `git clone --depth 1 https://github.com/anthropics/claude-code.git <upstream-dir>`

    Condition: `if: steps.check.outputs.up-to-date != 'true'`

G. **Create temp working directory** — `mkdir -p <tmp-dir>` (satisfies `extract.js` target requirement). Use `${{ runner.temp }}/sync-<hash>` and clean up on completion.

    Condition: `if: steps.check.outputs.up-to-date != 'true'`

H. **Run extraction pipeline:**

    Condition: `if: steps.check.outputs.up-to-date != 'true'`

    1. `node scripts/extract.js --source <upstream-dir> --target <tmp-dir>`
    2. Verify extracted skill count ≥ 20 (sanity check). If below threshold, fail with issue.
    3. `SOURCE_COMMIT=<hash> SOURCE_REPOSITORY=https://github.com/anthropics/claude-code.git node scripts/generate-manifest.js --output <tmp-dir>/skills.json`

       > **Important:** The `--output` flag is not yet implemented — it's listed as Implementation Scope item #2 below. This step and that implementation must land together. Until then, a workaround is to copy the project-level `skills.json` to the temp dir.

I. **Validate** — `SKILLS_DIR=<tmp-dir>/skills node scripts/validate.js`

    Condition: `if: steps.check.outputs.up-to-date != 'true'`

J. **Diff against current** — Compare extracted output with the current repository state:

    Condition: `if: steps.check.outputs.up-to-date != 'true'`

    ```yaml
    - name: Diff extracted output
      id: diff
      run: |
        diff -ru skills/ <tmp-dir>/skills/ > diff-output.txt || true
        diff -u skills.json <tmp-dir>/skills.json >> diff-output.txt || true
        if [ -s diff-output.txt ]; then
          echo "has-changes=true" >> "$GITHUB_OUTPUT"
        else
          echo "has-changes=false" >> "$GITHUB_OUTPUT"
          echo "No changes detected after extraction"
        fi
    ```

    The `|| true` prevents `diff`'s exit code 1 from failing the step. The check uses `-s` to test if the output file is non-empty.

K. **List deleted skills** — Before overwriting with `rsync`, capture which skills were removed upstream:

    Condition: `if: steps.diff.outputs.has-changes == 'true'`

    ```yaml
    - name: List deleted skills
      id: deleted
      run: |
        comm -23 <(ls skills/) <(ls <tmp-dir>/skills/) > deleted-skills.txt || true
        echo "Deleted: $(cat deleted-skills.txt | tr '\n' ' ')"
    ```

L. **Check for existing PR** — `gh pr list --head sync/upstream-<short-hash> --json number --jq '.[0].number' || echo "none"`

    Condition: `if: steps.diff.outputs.has-changes == 'true'`

    Store result in `steps.existing-pr.outputs.number`. Check `[ -n "$PR_NUMBER" ]` before reusing — an empty result returns `"none"`.

M. **Create or update PR:**

    Condition: `if: steps.diff.outputs.has-changes == 'true'`

    1. If PR exists (non-empty number), update branch and skip creation
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
    git checkout -B sync/upstream-<short-hash>
    ```
    The `-B` flag (capital B) force-creates the branch, succeeding even if the branch already exists.

3. **Stage and commit** — Copy temp output over current files (removing any skills deleted upstream), then commit:
    ```
    rsync -a --delete <tmp-dir>/skills/ skills/
    cp <tmp-dir>/skills.json skills.json
    git add -A skills/ skills.json
    git commit -m "chore: sync upstream claude-code <short-hash>"
    ```
    `git add -A` stages all changes including deletions (files removed upstream via `rsync --delete`).

4. **Push** — `git push origin sync/upstream-<short-hash>`

5. **PR** — Create with detailed body:
    ```
    gh pr create \
      --base main \
      --head sync/upstream-<short-hash> \
      --title "chore: sync upstream claude-code <short-hash>" \
      --body "<pr-body>"
    ```

### Error Handling

| Scenario | Action |
|----------|--------|
| Upstream unchanged | Step E gates all subsequent steps; workflow ends with "Up to date with <hash>" |
| No changes after pipeline | Step J sets `has-changes=false`; skip PR creation, log "no changes" |
| Validation fails | `validate.js` exit code fails the step → `if: failure()` issue creation |
| Pipeline fails | Any extraction step failure → `if: failure()` issue creation |
| Skill count below threshold | Step H.2 explicitly fails → `if: failure()` issue creation |
| PR already exists for same commit | Update existing PR branch instead of creating duplicate |

### Final Failure Step

A step at the end of the job runs `if: failure()` to create a GitHub Issue when any preceding step fails:

```yaml
- name: Create failure issue
  if: failure()
  run: |
    gh issue create \
      --title "upstream-sync: failure — <short-hash>" \
      --label "sync,upstream" \
      --body "See workflow run: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
```

The issue body includes a link to the workflow run for debugging. Issue creation itself uses `gh issue create`, which requires the `issues: write` permission.

### PR Content

The PR body includes:

- Source commit hash and link (`https://github.com/anthropics/claude-code/commit/<hash>`)
- List of changed, new, and removed skills (from the diff output and `deleted-skills.txt`)
- Pipeline and validation status
- Diff summary

### Issue Creation Template

When the `if: failure()` step creates an issue, the body includes:

```markdown
## Upstream Sync Failure

**Commit:** anthropics/claude-code@<hash>
**Workflow Run:** <url>
**Failure Type:** <validation-fail | pipeline-error | low-skill-count>

### Details
See workflow run logs linked above.

### Next Steps
- Review the workflow run logs linked above
- Resolve the issue and trigger manually via `workflow_dispatch`
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Trigger | Weekly cron + manual dispatch | Weekly cadence catches changes; dispatch with `force` enables on-demand re-sync |
| PR strategy | Single bundled PR | Keeps review scope manageable; avoids PR sprawl |
| Upstream access | Public repo, no auth | `anthropics/claude-code` is public; no PAT needed |
| Hosting | GitHub Actions | Repo is on GitHub; native integration |
| Diff strategy | Validate first, then diff | Never compare raw upstream — always diff transformed output to guarantee platform-neutrality |
| Validation gate | `validate.js` mandatory | Output must pass validation before PR creation. `npm test` validates script correctness during development, not extraction output during sync |
| Early exit | Step output variable gating | Prevents downstream steps from running when upstream is unchanged |
| Source hash format | 7-char short hash | Consistent with `skills.json` storage; used in branch names, commit messages, PR titles |

### Branch Strategy

- Sync branches: `sync/upstream-<short-hash>` (e.g., `sync/upstream-a1b2c3d`)
- Target: `main`
- Commit message: `chore: sync upstream claude-code <short-hash>`

Branch name omits the date to enable duplicate PR detection — the hash alone uniquely identifies the upstream commit, so checking for existing PRs by branch head works reliably.

> **Branch cleanup:** After a sync PR is merged, the sync branch is auto-deleted if the repository has "Automatically delete head branches" enabled (recommended, and default on GitHub). No explicit cleanup action is needed.

## Security Considerations

### Path Traversal Risk

If upstream contains a skill directory with a name crafted to escape the extraction tree, the pipeline could write outside the intended temp directory. Mitigation:

- The workflow extracts to `${{ runner.temp }}`, which is scoped per-job and ephemeral
- Each extraction step writes into `<tmp-dir>/skills/`. Downstream code that processes directory names via `mapDest` callbacks is the actual attack surface — Linux filenames cannot contain `/`, and Node.js `readdirSync()` never returns `.` or `..` directory entries
- **Implementation note:** `scripts/lib/files.js` should validate directory names produced by extraction callbacks, rejecting any that contain `..` or `/` before creating directories or writing files. Add this check as part of Implementation Scope.

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

2. **`scripts/generate-manifest.js`** — Add a `--output <path>` flag so the manifest JSON can be written to a temp directory instead of always overwriting the project-level `skills.json`. Default behavior (no flag) remains unchanged. Additionally, sort skill entries in the manifest output by `name` for deterministic ordering, eliminating ghost diffs from `readdirSync` nondeterminism across filesystems.

3. **`scripts/lib/files.js`** — Add path traversal sanitization for directory creation in extraction callbacks. Reject names containing `..` or `/`.

### No New Dependencies

All changes use Node.js built-in APIs. The workflow uses `actions/checkout@v4`, `actions/setup-node@v4`, and standard GitHub Actions tooling (`jq`, `rsync`, `gh` CLI are pre-installed on `ubuntu-latest` runners).

## Out of Scope

- Auto-merge (PRs require manual review)
- Notification beyond GitHub Issues/PRs
- Syncing specific tags or releases (always syncs latest main)
- Handling merge conflicts automatically (manual resolution required)
