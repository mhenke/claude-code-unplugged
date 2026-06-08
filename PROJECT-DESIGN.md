# Claude Code Unplugged

## Project Design

### Mission

Transform Claude Code-specific workflows, skills, commands, and automation patterns into portable assets, distributed exclusively as standard Agent Skills via `npx skills add`.

---

## Prime Directive

**Do not alter the behavior of the extracted Claude Code plugins.** The only transformation applied is platform-neutrality — replacing Claude-specific references (`Claude Code` → `coding assistant`, `.claude/` → `.agent/`, `hooks.json` → `hook-config.json`, `${CLAUDE_PLUGIN_ROOT}` → `PLUGIN_ROOT`, slash commands) with tool-agnostic equivalents. Everything else — the logic, structure, prompts, patterns — passes through unchanged.

Plugin behavior is the source of truth. This repo is a porting layer, not a rewrite.

---

## Problem Statement

Today, many high-quality agent capabilities are trapped inside specific ecosystems:
* Claude Code plugins
* Claude Code commands
* Claude Code workflows
* Custom project scripts
* Agent-specific prompt structures

This creates:
* Platform lock-in
* Duplicate effort
* Fragmented communities
* Difficult sharing

The same workflow or skill often gets recreated repeatedly for different agent systems.

---

## Objectives

### Primary Objectives

#### 1. Extract
Identify valuable capabilities, processes, and tools from Claude Code ecosystems.

#### 2. Normalize
Convert platform-specific artifacts into portable markdown-based formats.

#### 3. Publish
Expose capabilities through `npx skills add` to make them instantly installable by Cursor, Claude Code, and other editors.

---

## Architecture

```
                    ┌────────────────────────┐
                    │      Source Layer      │
                    │   (Original Assets)    │
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │  Transformation Layer  │
                    │   (extract.js + pipeline modules)  │
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │   Distribution Layer   │
                    │    (npx skills add)    │
                    └────────────────────────┘
```

### Source Layer
Original assets:
```text
plugins/
commands/
skills/
hooks/
agents/
scripts/
```

### Transformation Layer

The extraction pipeline is a thin orchestrator (`scripts/extract.js`) that delegates to stage modules:

```
extract.js (orchestrator, ~100 lines)
  ├── pipeline/copy-direct.js        — Copy direct skills from plugin skill dirs
  ├── pipeline/merge-commands.js     — Merge commands + agents into unified skills
  ├── pipeline/output-styles.js      — Extract output style skills
  ├── pipeline/security-guidance.js  — Translate security guidance plugin
  └── pipeline/github-management.js  — Package GitHub management scripts as skill
```

Shared utilities:

```
lib/cli.js        — CLI argument parsing (--source, --target, --help)
lib/files.js      — Recursive filesystem copy with transform/mapDest callbacks
lib/gates.js      — Verification gate builder (6 variants, config-driven)
lib/context.js    — Shell script context extraction
lib/skill-md.js   — SKILL.md writer (composes neutralization + gates)
lib/platform.js   — Platform-neutrality pattern detection and replacement
lib/frontmatter.js— YAML frontmatter parsing and normalization
```

Each stage produces files in a flat `skills/` directory:

```text
skills/
  commit-commands/
  security-guidance/
  code-review/
  github-management/
```

Each target contains:
```text
SKILL.md
references/
scripts/
examples/
```

### Distribution Layer
Supported target:
* `npx skills add <owner>/claude-code-unplugged/skills/<skill-name>`

---

## Repository Structure

```text
claude-code-unplugged/
│
├── LICENSE.md
├── README.md
├── PROJECT-DESIGN.md
├── AGENTS.md
├── package.json
├── skills.json                   # Auto-generated manifest (run generate-manifest.js)
│
├── scripts/
│   ├── extract.js                # Thin orchestrator — delegates to pipeline/ modules
│   ├── validate.js               # Validate all skills (frontmatter, naming, neutrality)
│   ├── generate-manifest.js      # Regenerate skills.json from skill directories
│   │
│   ├── lib/                      # Shared extraction utilities
│   │   ├── cli.js                # CLI argument parsing
│   │   ├── context.js            # Shell script context extraction
│   │   ├── files.js              # Recursive copy with transform/mapDest
│   │   ├── frontmatter.js        # YAML frontmatter parsing
│   │   ├── gates.js              # Verification gate builder (6 variants)
│   │   ├── platform.js           # Platform-neutrality pattern detection
│   │   └── skill-md.js           # SKILL.md writer
│   │
│   ├── pipeline/                 # Extraction pipeline stage modules
│   │   ├── copy-direct.js        # Stage 1: Copy direct skills
│   │   ├── merge-commands.js     # Stage 2: Merge commands + agents
│   │   ├── output-styles.js      # Stage 3: Output styles
│   │   ├── security-guidance.js  # Stage 4: Security guidance
│   │   └── github-management.js  # Stage 5: GitHub management
│   │
│   └── test/                     # Test suite
│       ├── validate.test.js
│       ├── generate-manifest.test.js
│       ├── extract.test.js       # Integration tests only
│       └── lib/                  # Per-module unit tests
│           ├── cli.test.js
│           ├── context.test.js
│           ├── files.test.js
│           ├── frontmatter.test.js
│           ├── gates.test.js
│           └── platform.test.js
│
├── openspec/                     # Spec-driven change workflow
│   ├── config.yaml
│   ├── specs/                    # Finalized specs
│   └── changes/                  # In-progress change proposals
│
└── skills/                       # 22 portable skill directories
    ├── frontend-design/
    │   └── SKILL.md
    ├── commit-commands/
    │   └── SKILL.md
    ├── code-review/
    │   └── SKILL.md
    ├── security-guidance/
    │   ├── SKILL.md
    │   └── scripts/
    ├── github-management/
    │   ├── SKILL.md
    │   └── scripts/
    └── ... (16 more)
```

---

## Skill Requirements

Every skill must:
* Be platform-neutral (no hardcoded `/command` execution assumptions).
* Avoid CLI-specific assumptions.
* Avoid model-specific assumptions.
* Use a single `SKILL.md` for metadata and core instructions.
* Keep `SKILL.md` frontmatter limited to `name` and `description`; store version and source provenance in `skills.json`.
* Put detailed guides, rules, and reference files in a `references/` directory.
* Put utility scripts (Python/Bash/Node) in a `scripts/` directory.
* Be understandable by humans.

---

## Deterministic Prompt-Enforced Hooks

Since GUI-based coding environments (Cursor, Copilot, VS Code) lack JSON hook runners or interception handlers, we rely on prompt instructions to enforce lifecycle security and workflow constraints. This repository uses the following cognitive patterns:

### 1. Gatekeeper Pattern
High-severity skills (like `security-guidance`, `code-review`, and `commit-commands`) inject a mandatory XML `<verification_gate>` section immediately before any tool use or code generation. The agent evaluates checklist items (e.g. `secrets`, `input_sanitization`, `paths`) and outputs PASS/FAIL status.

The gate variants are built by `scripts/lib/gates.js` — a config-driven module that maps skill names to their gate templates. Adding a new variant is a single Map entry:

| Skill | Gate Checks |
|---|---|
| `security-guidance` | secrets, input_sanitization, paths |
| `code-review` | conventions, correctness |
| `commit-commands` | conventions, correctness |
| `feature-dev` | current_phase, criteria_met |
| `hookify` | cognitive scan instructions |
| `ralph-wiggum` | self-enforced loop instructions |

### 2. Split-Attention Critique Pattern
To prevent confirmation bias, coding tasks are split: the agent outputs a draft, performs a `<self_critique>` evaluating potential bugs or convention mismatches, and only then produces `<final_code>`.

### 3. Cryptographic Promise Pattern
In iterative loops (such as `ralph-wiggum`), the agent tracks its current iteration and checks its own output for a `<promise>` XML block. The loop continues self-enforcing via user-prompt cycles until the promise is met or the iteration limit is reached.

---

## Non-Goals

The project does not aim to:
* Recreate Claude Code.
* Support multiple runtime compilation outputs.
* Maintain backward-compatible plugin directories for Claude Code installations.
* Rewrite, improve, or modernize the source plugin logic — only port with neutralization.

---

## Success Metrics

### Adoption
* Skill installations via `npx skills add`.
* Repository stars and forks.
* Community contributions of new normalized skills.
