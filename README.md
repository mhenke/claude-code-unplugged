# Claude Code Unplugged

> Portable agent skills, workflows, commands, and automation patterns extracted from Claude Code and adapted for any AI coding assistant.

## Why This Exists

Claude Code has developed a rich ecosystem of workflows, skills, commands, review processes, and automation patterns. Many of these ideas are valuable outside of Claude Code itself.

This repository extracts those concepts and repackages them into the open Agent Skills format (`SKILL.md`) so they can be installed and used in any supported coding assistant environment (such as Cursor, Claude Code, Gemini CLI, Qwen Code, and OpenCode).

The goal is not to recreate Claude Code. The goal is to preserve useful workflows and skills while removing platform lock-in.

---

## What You'll Find Here

All assets are located in the `skills/` directory:

### Workflows & Skills

Modular agent capabilities and structured engineering processes.

Examples:
*   **`skills/frontend-design`**: Guidance on bold design choices, typography, animations, and visual details.
*   **`skills/commit-commands`**: Unified instructions for composing semantic commit messages, pushing branches, and creating PRs.
*   **`skills/code-review`**: Multi-perspective code review guidelines and confidence-based scoring.
*   **`skills/feature-development`**: A structured software creation process covering exploration, design, implementation, and review.
*   **`skills/pr-review-toolkit`**: Review personas targeting comments, tests, error handling, types, and code simplification.
*   **`skills/security-guidance`**: Pattern-based safety reviews (e.g., path traversal, injection checks).

### Scripts

Optional helper scripts bundled inside specific skills.

Examples:
*   **`skills/github-management/scripts/`**: Automations for GitHub issue lifecycles (closing duplicates, commenting, label edits).
*   **`skills/security-guidance/scripts/`**: Command-line regex scanners to review edits for security patterns.

---

## Installation

Install a specific skill from this repository:

```bash
npx skills add <owner>/claude-code-unplugged/skills/<skill-name>
```

Or install the entire collection:

```bash
npx skills add <owner>/claude-code-unplugged
```

---

## Philosophy

This project follows several principles:

### Portable First
Workflows and skills should work across multiple agent runtimes.

### Open Formats
Content should use standard markdown-based `SKILL.md` files.

### Minimal Lock-In
Avoid dependencies on a single model, provider, or CLI.

### Human Maintainable
Skills should remain understandable and editable by humans.

---

## Relationship to Claude Code

This repository is inspired by and derived from workflows originally created for Claude Code environments. The contents are adapted to be platform-neutral whenever possible.

This project is not affiliated with Anthropic.

---

## Contributing

Contributions are welcome. Particularly valuable contributions include:
* Workflow extraction and normalization
* Skill portability improvements
* New agent-compatible formats
* Cross-CLI testing
* Documentation improvements

---

## Vision

Create the largest collection of portable software-engineering workflows and skills that can be used by any coding agent.

Build once. Use anywhere.
