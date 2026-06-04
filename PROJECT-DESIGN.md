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
Converts source assets into a flat `skills/` folder:
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
│
├── scripts/
│   └── extract.js            # Helper script to pull assets from source repo
│
└── skills/
    ├── frontend-design/
    │   └── SKILL.md
    ├── commit-commands/
    │   └── SKILL.md
    ├── pr-review-toolkit/
    │   └── SKILL.md
    ├── security-guidance/
    │   ├── SKILL.md
    │   └── scripts/
    │       ├── security_reminder_hook.py
    │       └── patterns.py
    └── github-management/
        ├── SKILL.md
        └── scripts/
            ├── auto-close-duplicates.ts
            └── sweep.ts
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
