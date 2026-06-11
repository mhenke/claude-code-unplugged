# AGENTS.md

## Project

A collection of portable agent skills extracted from Claude Code, packaged as standard `SKILL.md` files. Distributable via `npx skills add`. Zero npm dependencies — pure Node.js (CommonJS), vanilla JS, Markdown.

## Commands

```bash
npm test                              # 21 tests across 3 test suites: validate, generate-manifest, extract
node --test scripts/test/**/*.test.js # run all 10 test files (lib tests too)
node scripts/validate.js              # validate all skills (exits 0 on success, 1 on failure)
node scripts/extract.js --source <path> --target <path>  # run 5-stage extraction pipeline
node scripts/generate-manifest.js     # regenerate skills.json from skill directories
```

Env vars: `SKILLS_DIR` (override skills path, default `./skills`), `SKILL_VERSION` (default `0.1.0`), `SOURCE_REPOSITORY`/`SOURCE_COMMIT` (provenance metadata for manifest).

## Architecture

- **`scripts/lib/`** — 7 shared modules: `cli.js`, `context.js`, `files.js`, `frontmatter.js`, `gates.js`, `platform.js`, `skill-md.js`
- **`scripts/pipeline/`** — 5 sequential extraction stages: `copy-direct` → `merge-commands` → `output-styles` → `security-guidance` → `github-management`
- **`scripts/test/`** — Tests per lib module + integration tests for validate/manifest/extract

Run `generate-manifest.js` and commit `skills.json` whenever a skill directory is added or changed.

## Skill format

Each skill is a directory under `skills/` with a `SKILL.md` file. YAML frontmatter limited to `name` and `description`:

```yaml
---
name: skill-slug        # must match directory name; lowercase, dashes only
description: ...         # required
---
```

Optional subdirectories: `scripts/`, `references/`, `examples/`. Version and source provenance live in `skills.json`, not frontmatter.

## Content rules

- **Platform-neutral**: no "Claude Code", `hooks.json`, `${CLAUDE_PLUGIN_ROOT}`, `.claude/` paths, or `/command` syntax — enforced by `scripts/lib/platform.js`
- Skills are ported source artifacts, not agent instructions for this repo

## Development workflow (openspec)

Proposals and specs live under `openspec/`:
- `openspec/changes/<name>/proposal.md` — what and why
- `openspec/changes/<name>/design.md` — technical design
- `openspec/changes/<name>/tasks.md` — implementation tasks
- `openspec/specs/` — finalized specs

Prime directive: do not alter behavior of extracted source plugins. Only platform-neutrality transformations are permitted.
