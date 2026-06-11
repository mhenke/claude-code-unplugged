# Claude Code Unplugged

This repository contains portable agent skills, workflows, and automation patterns extracted from Claude Code. They are formatted as standard, platform-neutral `SKILL.md` files that you can use with Cursor, Copilot, Gemini, and other coding assistants.

Landing page: https://mhenke.github.io/claude-code-unplugged/

## Installation

You can add the collection to your workspace by running:
```bash
npx skills add mhenke/claude-code-unplugged
```

---

## What's inside

### Workflows and personas
*   [feature-dev](skills/feature-dev/SKILL.md): A 7-phase software engineering and implementation cycle.
*   [code-review](skills/code-review/SKILL.md): A multi-persona automated PR and code reviewer.
*   [commit-commands](skills/commit-commands/SKILL.md): Git commit and repository lifecycle workflows.
*   [pr-review-toolkit](skills/pr-review-toolkit/SKILL.md): Specialized review personas for catching silent failures and other defects.
*   [explanatory-output-style](skills/explanatory-output-style/SKILL.md): An educational output style that adds inline insights.
*   [learning-output-style](skills/learning-output-style/SKILL.md): A collaborative output style focused on learning.
*   [ralph-wiggum](skills/ralph-wiggum/SKILL.md): Iterative feedback loops and self-enforced checks.

### Aesthetics and security
*   [frontend-design](skills/frontend-design/SKILL.md): Guidelines for building responsive, high-quality UIs.
*   [security-guidance](skills/security-guidance/SKILL.md): Diff review guidance and automated security warnings.

### Plugin and agent development
*   [plugin-dev](skills/plugin-dev/SKILL.md): A guide for creating plugins from scratch.
*   [plugin-structure](skills/plugin-structure/SKILL.md): Plugin directory layouts and manifest conventions.
*   [plugin-settings](skills/plugin-settings/SKILL.md): Project-level settings using YAML frontmatter.
*   [agent-development](skills/agent-development/SKILL.md): System prompts and agent architecture.
*   [command-development](skills/command-development/SKILL.md): Custom slash commands and arguments.
*   [skill-development](skills/skill-development/SKILL.md): Structure and tips for writing new skills.
*   [hook-development](skills/hook-development/SKILL.md): Creating PreToolUse, PostToolUse, and Stop hooks.
*   [hookify](skills/hookify/SKILL.md): An extensible prompt hooks engine.
*   [writing-rules](skills/writing-rules/SKILL.md): Hookify rule syntax and validation.
*   [mcp-integration](skills/mcp-integration/SKILL.md): Model Context Protocol configuration.

### Automation and sync
*   [github-management](skills/github-management/SKILL.md): GitHub issue and PR management automation.
*   [claude-opus-4-5-migration](skills/claude-opus-4-5-migration/SKILL.md): Prompt and API migration to Opus 4.5.
*   [agent-sdk-dev](skills/agent-sdk-dev/SKILL.md): Agent SDK application guidelines.

---

## Updating

To update all skills, run:
```bash
npx skills update
```

To update specific skills:
```bash
npx skills update feature-dev code-review
```

You can pass these options:
*   `-g` or `-p` to update only global or project-scoped skills.
*   `-y` to skip the interactive prompts.

---

## Philosophy

This collection relies on three simple ideas:
*   We translate platform-specific directives into standard English so they work with any model.
*   Every skill is a plain, portable markdown file.
*   We keep everything simple, with no compilation or build pipelines.

---

## Contributing

If you want to extract and validate new skills, run:
```bash
node scripts/extract.js --source /path/to/claude-code --target .
node scripts/validate.js
```

---

*Disclaimer: This repository is a community-driven project to make prompts portable. It is not affiliated with or endorsed by Anthropic.*
