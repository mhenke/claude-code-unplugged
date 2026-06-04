# Claude Code Unplugged

## Project Design

### Mission

Transform Claude Code-specific workflows, skills, commands, and automation patterns into portable assets, distributed exclusively as standard Agent Skills via `npx skills add`.

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
                    │   (Extraction Script)  │
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
Converts source assets into flat skill directories at the repo root:
```text
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
* `npx skills add <owner>/claude-code-unplugged`
* `npx skills add <owner>/claude-code-unplugged/<skill-name>`

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
│   ├── validate.js               # Validate all skills (frontmatter, naming, neutrality)
│   ├── generate-manifest.js      # Regenerate skills.json from skill directories
│   ├── extract.js                # Pull and neutralize assets from a source repo
│   └── test/
│       ├── validate.test.js
│       ├── generate-manifest.test.js
│       └── extract.test.js
│
├── openspec/                     # Spec-driven change workflow
│   ├── config.yaml
│   ├── specs/                    # Finalized specs
│   └── changes/                  # In-progress change proposals
│       └── <change-name>/
│           ├── proposal.md
│           ├── design.md
│           └── tasks.md
│
├── frontend-design/             # 22 portable skill directories (repo root)
│   └── SKILL.md
├── commit-commands/
│   └── SKILL.md
├── code-review/
│   └── SKILL.md
├── security-guidance/
│   ├── SKILL.md
│   └── scripts/
│       ├── security_reminder_hook.py
│       └── patterns.py
├── github-management/
│   ├── SKILL.md
│   └── scripts/
│       ├── auto-close-duplicates.ts
│       └── sweep.ts
├── ... (17 more skill directories)
```

---

## Skill Requirements

Every skill must:
* Be platform-neutral (no hardcoded `/command` execution assumptions).
* Avoid CLI-specific assumptions.
* Avoid model-specific assumptions.
* Use a single `SKILL.md` for metadata and core instructions.
* Put detailed guides, rules, and reference files in a `references/` directory.
* Put utility scripts (Python/Bash/Node) in a `scripts/` directory.
* Be understandable by humans.

---

## Deterministic Prompt-Enforced Hooks

Since GUI-based coding environments (Cursor, Copilot, VS Code) lack JSON hook runners or interception handlers, we rely on prompt instructions to enforce lifecycle security and workflow constraints. This repository uses the following cognitive patterns:

### 1. Gatekeeper Pattern
High-severity skills (like `security-guidance`, `code-review`, and `commit-commands`) inject a mandatory XML `<verification_gate>` section immediately before any tool use or code generation. The agent evaluates checklist items (e.g. `secrets`, `input_sanitization`, `paths`) and outputs PASS/FAIL status.

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

---

## Success Metrics

### Adoption
* Skill installations via `npx skills add`.
* Repository stars and forks.
* Community contributions of new normalized skills.
