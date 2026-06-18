# AGENTS.md

## Project

A collection of portable agent skills extracted from Claude Code, packaged as standard `SKILL.md` files. Distributable via `npx skills add`. Zero npm dependencies — pure Node.js (CommonJS), vanilla JS, Markdown.

## Commands

```bash
npm test                              # 21 tests across 3 test suites: validate, generate-manifest, extract
npm run test:all                      # all 10+ test files (lib tests too)
npm run validate                      # validate all skills (exits 0 on success, 1 on failure)
npm run check-lock                    # check skills-lock.json staleness
npm run extract -- --source <path> --target <path> --commit auto   # run 5-stage extraction pipeline
npm run generate-manifest             # regenerate skills.json from skill directories
```

Env vars: `SKILLS_DIR` (override skills path, default `./skills`), `SKILL_VERSION` (default `0.1.0`).

## Architecture

- **`scripts/lib/`** — 7 shared modules: `cli.js`, `context.js`, `files.js`, `frontmatter.js`, `gates.js`, `platform.js`, `skill-md.js`
- **`scripts/pipeline/`** — 5 sequential extraction stages: `copy-direct` → `merge-commands` → `output-styles` → `security-guidance` → `github-management`
- **`scripts/test/`** — Tests per lib module + integration tests for validate/manifest/extract

## Invariants

- **Never edit files under `skills/` directly.** All skill content is produced by `scripts/extract.js`. Manual edits will be overwritten on next extraction and caught by `npm run check-lock`.
- **skills-lock.json** tracks SHA-256 hashes of all tracked files per skill. Run `npm run check-lock` to verify the skills tree matches the lockfile. This is part of the default CI workflow.
- **skills.json** provenance (sourceCommit, sourceRepository) is read from `skills-lock.json`, which is written by `extract.js`. Do not edit `skills.json` provenance manually.
- Extract.js accepts `--commit auto` to auto-detect the source commit SHA from the upstream git repository.

## End-to-end update workflow

```bash
# 1. Pull latest upstream
git -C /path/to/claude-code pull origin main

# 2. Re-extract all skills (auto-detects commit from source dir)
node scripts/extract.js --source /path/to/claude-code --target . --commit auto

# 3. Regenerate manifest (reads provenance from skills-lock.json)
node scripts/generate-manifest.js

# 4. Validate everything
npm test
node scripts/validate.js
node scripts/check-lock-staleness.js

# 5. Commit with upstream SHA in message
git add .
git commit -m "sync: update from upstream (SHA)"
```

## Skill format

Each skill is a directory under `skills/` with a `SKILL.md` file. YAML frontmatter limited to `name`, `description`, and `platformExempt`:

```yaml
---
name: skill-slug        # must match directory name; lowercase, dashes only
description: ...         # required
platformExempt: true     # optional; exempts skill from model-tier neutrality checks
---
```

Optional subdirectories: `scripts/`, `references/`, `examples/`. Version and source provenance live in `skills.json`, not frontmatter.

## Content rules

- **Platform-neutral**: no "Claude Code", `hooks.json`, `${CLAUDE_PLUGIN_ROOT}`, `.claude/` paths, or `/command` syntax — enforced by `scripts/lib/platform.js`
- **Model-tier neutral**: no provider-specific model tier names (haiku, sonnet, opus) except in exempt skills — enforced by `scripts/lib/platform.js`
- Skills are ported source artifacts, not agent instructions for this repo

## Platform exemptions

Skills that inherently discuss specific model versions (e.g., migration guides) can opt out of model-tier neutralization:
- Add `platformExempt: true` to the skill's YAML frontmatter
- Also register in `MODEL_TIER_EXEMPT_SKILLS` in `scripts/lib/platform.js` (required for pipeline stages that process partial content)
- Both mechanisms are checked at validation time

## Verification gates

Skills with pre-execution verification gates are defined in `scripts/lib/gates.js`. Current gated skills:
- `security-guidance` — secrets, input sanitization, path traversal
- `commit-commands` — conventions, correctness
- `code-review` — conventions, correctness
- `feature-dev` — phase verification
- `hookify` — Hookify rule scanning
- `ralph-wiggum` — Ralph feedback loop

## Development workflow (openspec)

Proposals and specs live under `openspec/`:
- `openspec/changes/<name>/proposal.md` — what and why
- `openspec/changes/<name>/design.md` — technical design
- `openspec/changes/<name>/tasks.md` — implementation tasks
- `openspec/specs/` — finalized specs

Prime directive: do not alter behavior of extracted source plugins. Only platform-neutrality transformations are permitted.
