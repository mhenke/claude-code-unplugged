# Upstream Sync Automation Design

## Problem

The claude-code-unplugged repo extracts portable skills from the upstream `anthropics/claude-code` repo. Currently, syncing upstream changes is a manual process: clone the upstream repo, run the extraction pipeline, diff outputs, and manually commit changes. This is error-prone and easy to forget.

## Solution

Automate upstream sync via a GitHub Actions workflow that periodically checks for upstream changes, runs the full extraction pipeline, and creates a PR when differences are detected.

## Architecture

### Workflow: `sync-upstream.yml`

A single GitHub Actions workflow in `.github/workflows/` that:

1. **Triggers** on schedule (weekly, Monday 00:00 UTC) and manual `workflow_dispatch`
2. **Clones** the upstream `anthropics/claude-code` public repo (no auth needed)
3. **Runs the full extraction pipeline** to a temp directory:
   - `node scripts/extract.js --source <upstream-clone> --target <tmp-dir>`
   - `node scripts/generate-manifest.js` (with `SOURCE_COMMIT` and `SOURCE_REPOSITORY` env vars)
4. **Diffs** the transformed output against current `skills/` and `skills.json`
5. **Validates** the output with `node scripts/validate.js`
6. **Creates a PR** if changes are detected, or **creates an issue** if validation fails

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Trigger | Weekly cron + manual dispatch | Weekly cadence catches changes; dispatch enables on-demand sync |
| PR strategy | Single bundled PR | Keeps review scope manageable; avoids PR sprawl |
| Upstream access | Public repo, no auth | `anthropics/claude-code` is public; no PAT needed |
| Hosting | GitHub Actions | Repo is on GitHub; native integration |
| Diff strategy | Full pipeline then diff | Never compare raw upstream — always diff transformed output to guarantee platform-neutrality |
| Validation gate | `validate.js` mandatory | Pipeline output must pass validation before PR creation |

### Branch Strategy

- Sync branches: `sync/upstream-<short-hash>-<date>` (e.g., `sync/upstream-a1b2c3d-2026-06-11`)
- Target: `main`
- Commit message: `chore: sync upstream claude-code <short-hash>`

### PR Content

The PR body includes:

- Source commit hash and link
- List of changed, new, and removed skills
- Pipeline and validation status
- Diff summary

### Error Handling

| Scenario | Action |
|----------|--------|
| No changes detected | Skip PR creation, log "up to date" |
| Validation fails | Create a GitHub Issue with failure details, skip PR |
| Pipeline fails | Create a GitHub Issue with error logs, skip PR |
| PR already exists for same commit | Update existing PR instead of creating duplicate |

### Workflow Permissions

The workflow needs `contents: write` and `pull-requests: write` permissions to create branches and PRs. Uses the default `GITHUB_TOKEN`.

## Implementation Scope

1. Create `.github/workflows/sync-upstream.yml`
2. No changes to existing scripts — the workflow invokes them as-is
3. No new dependencies — uses Node.js built into GitHub Actions runners

## Out of Scope

- Auto-merge (PRs require manual review)
- Notification beyond GitHub Issues/PRs
- Syncing specific tags or releases (always syncs latest main)
- Handling merge conflicts automatically (manual resolution required)
