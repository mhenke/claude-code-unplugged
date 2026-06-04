# Claude Code Unplugged 🔌

> Portable agent skills, workflows, commands, and automation scripts extracted from Claude Code, ready to use in any AI coding assistant (Cursor, Gemini CLI, Copilot, VS Code, etc.).

## 💡 Why this exists

Claude Code is fantastic, but some of its best features—like the structured multi-phase feature development loop, automated PR reviews, and smart commit generation—are tightly bound to its CLI. 

We wanted to use those same battle-tested workflows, prompts, and helper scripts in **Cursor, Gemini, Qwen, or custom local agents**. 

This repository extracts those prompt patterns and translates them into the open Agent Skills format (`SKILL.md`). You can install the entire collection in seconds:
```bash
npx skills add mhenke/claude-code-unplugged
```

No platform lock-in. No proprietary runtimes. Just great agent prompts and scripts that work anywhere.

---

## 📦 What's inside?

Skills live at the repo root, each in their own directory. Here's the full library:

### 🚀 Workflows & Prompt Skills
Modular agent instructions that teach your AI assistant how to perform complex, multi-step engineering tasks:
*   [frontend-design](./frontend-design/SKILL.md) — Guides agents to build gorgeous, responsive UIs with curated HSL colors, Google Fonts, and smooth micro-animations instead of basic browser defaults.
*   [commit-commands](./commit-commands/SKILL.md) — Ported versions of `/commit`, `/commit-push-pr`, and `/clean_gone` translated into clean, step-by-step instructions.
*   [code-review](./code-review/SKILL.md) — Parallel agent PR review logic: spawns multiple reviewer personas (guidelines checkers, bug hunters, logic validators) to score and comment on code.
*   [feature-dev](./feature-dev/SKILL.md) — A 7-phase software engineering cycle: Codebase Exploration ➡️ Clarifying Questions ➡️ Architecture Blueprints ➡️ Implementation ➡️ Review.
*   [github-management](./github-management/SKILL.md) — Automation scripts to auto-detect duplicate issues, close stale issues, manage labels, and run sweeps.

### 🎭 Agent Personas & Output Styles
Instruct your coding assistant to act as a specific sub-agent or write in a different mode:
*   [pr-review-toolkit](./pr-review-toolkit/SKILL.md) — Specialised reviewer personas: *Silent Failure Hunter*, *Code Simplifier*, *PR Test Analyzer*, and *Type Design Analyzer*.
*   [explanatory-output-style](./explanatory-output-style/SKILL.md) — Puts the model into an educational mode, requiring it to explain implementation choices with formatted `★ Insight` boxes before and after code edits.
*   [learning-output-style](./learning-output-style/SKILL.md) — A hybrid learning mode: the agent writes boilerplate, identifies key design files, and requests small code contributions from you to encourage learning.
*   [ralph-wiggum](./ralph-wiggum/SKILL.md) — Iterative self-enforcing feedback loop. The agent tracks its own promise-completion state and loops until done.

### 🛠️ Automation & Helper Scripts
Executable scripts bundled inside respective skill folders that your agent can run locally:
*   [security-guidance](./security-guidance/SKILL.md) — Runs a regex-based security scanner (`scripts/security_reminder_hook.py`) on edits, checking for secrets, raw `innerHTML`, unsafe serialization, and more.

### 🔌 Plugin & Agent Development
Skills for building new plugins, agents, hooks, and skills for AI coding assistants:
*   [plugin-dev](./plugin-dev/SKILL.md) — Comprehensive guide for developing new CLI plugins from scratch.
*   [plugin-structure](./plugin-structure/SKILL.md) — Plugin directory layout, manifest config, component organization, and naming conventions.
*   [plugin-settings](./plugin-settings/SKILL.md) — Patterns for user-configurable plugin settings via `.agent/plugin-name.local.md` files with YAML frontmatter.
*   [agent-development](./agent-development/SKILL.md) — Agent structure, system prompts, triggering conditions, and development best practices.
*   [hook-development](./hook-development/SKILL.md) — Creating PreToolUse/PostToolUse/Stop hooks with prompt-based enforcement patterns.
*   [hookify](./hookify/SKILL.md) — Extensible user-configured prompt hooks with a full rule engine and examples.
*   [command-development](./command-development/SKILL.md) — Slash command structure, YAML frontmatter fields, dynamic arguments, and user interaction patterns.
*   [skill-development](./skill-development/SKILL.md) — Skill structure, progressive disclosure patterns, and best practices for writing new skills.
*   [mcp-integration](./mcp-integration/SKILL.md) — Integrating Model Context Protocol (MCP) servers into plugins for external tool and service integration.
*   [writing-rules](./writing-rules/SKILL.md) — Hookify rule syntax and patterns for building agent governance rules.

### 🔄 Migration & SDK
*   [claude-opus-4-5-migration](./claude-opus-4-5-migration/SKILL.md) — One-shot migration of prompts and API calls to Opus 4.5, including model string updates.
*   [agent-sdk-dev](./agent-sdk-dev/SKILL.md) — Guidance for building Agent SDK applications.

---

## ⚙️ Installation

Install the entire collection:
```bash
npx skills add mhenke/claude-code-unplugged
```

Or install a single skill:
```bash
npx skills add mhenke/claude-code-unplugged/<skill-name>

For example, to install only the code reviewer:
```bash
npx skills add mhenke/claude-code-unplugged/code-review
```

---

## 🕊️ Philosophy

* **CLI & Model Agnostic:** Translated from proprietary syntax (`!` command interpolations or Claude-only hooks) into standard English directives that any modern LLM can interpret.
* **Pure Markdown:** Every skill uses the standard `SKILL.md` format. No dependencies, no package files.
* **Keep it Simple:** No complex compilation pipelines. Just copy, refactor, and distribute.

---

## 🤝 Contributing

Find a cool command, agent, or workflow in the Claude Code source tree that isn't here? Open a PR! 
You can run our built-in extraction utility to sync and validate:
```bash
node scripts/extract.js --source /path/to/claude-code --target .
node scripts/validate.js
```

---

*Disclaimer: This repository is a community-driven project to make prompts portable. It is not affiliated with or endorsed by Anthropic.*
