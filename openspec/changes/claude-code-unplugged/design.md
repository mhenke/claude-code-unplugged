## Context

The `anthropics/claude-code` repository contains a variety of valuable plugins (slash commands, specialized agent prompts, event-driven hooks) and GitHub issue management scripts. These are currently tightly coupled with the Anthropic Claude Code plugin system. To make them portable and compatible with the broader AI agent ecosystem via `npx skills add`, we need a lightweight extraction script that maps, refactors, and outputs them into a standalone flat `skills/` directory structure.

## Goals / Non-Goals

**Goals:**
- Create an extraction script (`scripts/extract.js`) that copies and refactors source files.
- Convert Claude Code slash commands, specialized agents, and hooks into standard, platform-agnostic `SKILL.md` markdown files.
- Package internal issue management scripts from `/scripts` into a portable `github-management` skill.
- Structure the standalone repository to be directly compatible with `npx skills add`.

## Non-Goals:
- Building a complex multi-harness compiler target pipeline.
- Maintaining compatibility with the proprietary runtime hook APIs of the official Claude Code CLI in the output skills repository.
- Re-writing or mimicking the Claude Code terminal UI.

## Decisions

### 1. Flat Skills Structure over Multi-Harness Targets
- **Decision**: Avoid the compilation pipeline (e.g. `make generate`) and target a single flat skills directory layout.
- **Rationale**: Since the user wants this exclusively installed by `npx skills add` and does not want the project to expand beyond portable skills, commands, and scripts, a simple flat structure at the root of the target repository is the most direct, maintainable, and lightweight approach.

### 2. Semantic Hook Translation
- **Decision**: Translate prompt-based hooks (`PreToolUse`, `Stop`) into explicit procedural sections (e.g. `## Pre-Execution Validation Checks`, `## Quality Verification Checklist`) in `SKILL.md`.
- **Rationale**: General-purpose coding assistants (such as Cursor or Copilot) do not support the `hooks.json` schema. Re-writing hooks as prominent markdown guidelines ensures that any agent loading the skill will read and follow the validation steps during its execution cycle.

### 3. Encapsulating Helper Scripts
- **Decision**: Copy associated python/bash/typescript helper scripts into a `scripts/` directory inside each respective skill folder (e.g., `skills/security-review/scripts/`).
- **Rationale**: Organizes all executable files cleanly inside their respective skill modules. The `SKILL.md` file will instruct the AI agent on how to run them (e.g., "execute `python scripts/security_reminder_hook.py` using your bash tool").

### 4. Zero-Dependency Plain JavaScript Utility
- **Decision**: Write the extraction utility in plain Node.js (JavaScript) as `scripts/extract.js` without any external dependencies or `package.json` setup.
- **Rationale**: Keeps the target repository static and dependency-free, avoiding the need for users or developers to run `npm install` inside `claude-code-unplugged`. It runs instantly using the standard `node` command available on the host machine.

## Risks / Trade-offs

- **[Risk]**: AI agents may ignore the translated hook guidelines in `SKILL.md` since they are not enforced by runtime hook code.
  - **Mitigation**: Write the guidelines in strict imperative form using bold warnings at the top of the skill files to maximize prompt compliance.
- **[Risk]**: Hardcoded paths inside copied scripts might break when installed in a different project root.
  - **Mitigation**: Audit and refactor the copied scripts to resolve paths relative to the project root or the workspace directory dynamically rather than assuming a fixed plugin directory.
