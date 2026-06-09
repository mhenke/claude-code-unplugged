# Domain Glossary — Claude Code Unplugged

This file defines every domain term used across the project. When the code or
documentation introduces a concept, check here first. Consistent vocabulary is
the point — don't drift into synonyms.

## Core Concepts

### Skill
A portable agent capability distributed via `npx skills add`. Each skill is a
directory under `skills/` containing a `SKILL.md` with YAML frontmatter (name +
description only) and optional `scripts/`, `references/`, and `examples/`
subdirectories. Skills are the unit of distribution — everything else in the
pipeline exists to produce them.

_Same as:_ plugin (legacy Claude Code term), command (when merged into a skill)
_Not:_ module (see LANGUAGE.md), package (npm)

### Source (also: Source Asset)
An original artifact from the Claude Code ecosystem: a plugin directory,
command definition, hook script, agent persona, or custom script. Sources live
outside this repo and are the input to the extraction pipeline.

### Extraction (also: Extraction Pipeline)
The process of transforming source assets into portable skills. Implemented by
`scripts/extract.js` and its five stage modules under `scripts/pipeline/`.
Extraction is not a rewrite — the only transformation applied is
platform-neutrality.

### Platform-Neutrality (also: Neutralization)
The policy of replacing Claude Code-specific references with
tool-agnostic equivalents. Defined and enforced by `scripts/lib/platform.js`.

| Source Pattern | Replacement |
|---|---|
| `Claude Code` | `coding assistant` |
| `hooks.json` | `hook-config.json` |
| `${CLAUDE_PLUGIN_ROOT}` | `PLUGIN_ROOT` |
| `.claude/` | `.agent/` |
| `/command` | `command` (bare name) |

### Pipeline Stage
One of five sequential phases in the extraction pipeline. Each stage handles a
different source asset type and lives in `scripts/pipeline/`:

1. **copy-direct** — Copies already-structured skills from plugin skill dirs
2. **merge-commands** — Merges commands + agents into unified skill directories
3. **output-styles** — Extracts output style skills from session-start hooks
4. **security-guidance** — Translates the security-guidance plugin
5. **github-management** — Packages GitHub scripts as a skill

### Manifest (skills.json)
The auto-generated index of all 22 skills. Produced by
`scripts/generate-manifest.js` by scanning `skills/` directories and parsing
SKILL.md frontmatter. Contains name, description, path, version, bodyLength,
and optional provenance for each skill.

### Verification Gate
A deterministic prompt-enforced XML checklist injected into high-severity
skills. Built by `scripts/lib/gates.js`. Each gate has a specific set of
checks depending on the skill:

| Skill | Gate Checks |
|---|---|
| `security-guidance` | secrets, input_sanitization, paths |
| `code-review` | conventions, correctness |
| `commit-commands` | conventions, correctness |
| `feature-dev` | current_phase, criteria_met |
| `hookify` | cognitive scan instructions |
| `ralph-wiggum` | self-enforced loop instructions |

### Frontmatter
The YAML metadata block at the top of every `SKILL.md`. Limited to exactly two
fields: `name` (slug, matching the directory name) and `description` (plain
text). Version and source provenance are stored in the manifest, not
frontmatter.

### Shared Lib
The common utility modules under `scripts/lib/`. Used by all pipeline stages:

- `cli.js` — CLI argument parsing
- `context.js` — Shell script context extraction
- `files.js` — Recursive copy with transform/mapDest callbacks
- `frontmatter.js` — YAML frontmatter parsing and normalization
- `gates.js` — Verification gate builder
- `platform.js` — Platform-neutrality detection and replacement
- `skill-md.js` — SKILL.md composer

### Openspec
The spec-driven change workflow used to develop this project. Proposals live in
`openspec/changes/<name>/` with proposal.md, design.md, tasks.md, and specs/.
Finalized specs go in `openspec/specs/`.

## Distribution Concepts

### Distribution Layer
The delivery mechanism for skills: `npx skills add <owner>/<repo>/skills/<name>`.
Skills are consumed directly from this GitHub repository — no build step, no
npm package, no registry. The repository *is* the distribution channel.

### Prime Directive
The governing constraint: **do not alter the behaviour of extracted source
plugins.** Only platform-neutrality transformations are permitted. This repo is
a porting layer, not a rewrite.

## Skill Categories (from README)

- **Workflows & Prompt Skills** — frontend-design, commit-commands, code-review,
  feature-dev, etc.
- **Agent Personas & Output Styles** — pr-review-toolkit,
  explanatory-output-style, learning-output-style, ralph-wiggum
- **Automation & Helper Scripts** — security-guidance, github-management
- **Plugin & Agent Development** — plugin-dev, plugin-structure, plugin-settings,
  agent-development, hook-development, hookify, command-development,
  skill-development, mcp-integration, writing-rules
- **Migration & SDK** — claude-opus-4-5-migration, agent-sdk-dev

## Deterministic Prompt Patterns

### Gatekeeper Pattern
A high-severity skill injects a mandatory `<verification_gate>` XML block
before any tool use. The agent evaluates checklist items and outputs PASS/FAIL.

### Split-Attention Critique Pattern
Tasks are split: draft → `<self_critique>` → `<final_code>` to prevent
confirmation bias during code generation.

### Cryptographic Promise Pattern
Iterative loops (ralph-wiggum) track iteration count via a `<promise>` XML
block. The loop self-enforces until the promise is met or the iteration limit
is reached.
