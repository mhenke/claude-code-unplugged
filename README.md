# Claude Code Unplugged 🔌

> Portable agent skills, workflows, commands, and automation scripts extracted from Claude Code, ready to use in any AI coding assistant (Cursor, Gemini CLI, Copilot, VS Code, etc.).

## 💡 Why this exists

Claude Code is fantastic, but some of its best features—like the structured multi-phase feature development loop, automated PR reviews, and smart commit generation—are tightly bound to its CLI. 

We wanted to use those same battle-tested workflows, prompts, and helper scripts in **Cursor, Gemini, Qwen, or custom local agents**. 

This repository extracts those prompt patterns and translates them into the open Agent Skills format (`SKILL.md`). Install the collection with:
```bash
npx skills add mhenke/claude-code-unplugged
```

No platform lock-in. No proprietary runtimes. Just great agent prompts and scripts that work anywhere.

---

## 📦 What's inside?

We've organized the extractions into a flat `skills/` directory:

### 🚀 Workflows & Prompt Skills
Modular agent instructions that teach your AI assistant how to perform complex, multi-step engineering tasks:
*   [frontend-design](file:///home/mhenke/Projects/claude-code-unplugged/skills/frontend-design/SKILL.md) — Guides agents to build gorgeous, responsive UIs with curated HSL colors, Google Fonts, and smooth micro-animations instead of basic browser defaults.
*   [commit-commands](file:///home/mhenke/Projects/claude-code-unplugged/skills/commit-commands/SKILL.md) — Ported versions of `/commit`, `/commit-push-pr`, and `/clean_gone` translated into clean, step-by-step instructions.
*   [code-review](file:///home/mhenke/Projects/claude-code-unplugged/skills/code-review/SKILL.md) — The parallel agent PR review logic. Instructs your agent to spawn parallel review personas (project guideline checkers, bug hunters, and history analyzers) to score and comment on code.
*   [feature-dev](file:///home/mhenke/Projects/claude-code-unplugged/skills/feature-dev/SKILL.md) — A 7-phase software engineering cycle: Discovery ➡️ Codebase Exploration ➡️ Clarifying Questions ➡️ Architecture Design ➡️ Implementation ➡️ Quality Review ➡️ Summary.

### 🎭 Agent Personas & Output Styles
Instruct your coding assistant to act as a specific sub-agent or write in a different mode:
*   [pr-review-toolkit](file:///home/mhenke/Projects/claude-code-unplugged/skills/pr-review-toolkit/SKILL.md) — Specialised reviewer personas: *Silent Failure Hunter*, *Code Simplifier*, *PR Test Analyzer*, and *Type Design Analyzer*.
*   [explanatory-output-style](file:///home/mhenke/Projects/claude-code-unplugged/skills/explanatory-output-style/SKILL.md) — Puts the model into an educational mode, requiring it to explain implementation choices with formatted `★ Insight` boxes before and after code edits.
*   [learning-output-style](file:///home/mhenke/Projects/claude-code-unplugged/skills/learning-output-style/SKILL.md) — A hybrid learning mode. Instead of doing all the work, the agent is instructed to write boilerplate, identify key design files, and request 5-10 line code contributions from you.
*   [ralph-wiggum](file:///home/mhenke/Projects/claude-code-unplugged/skills/ralph-wiggum/SKILL.md) — Iterative self-enforcing feedback loop. The agent tracks its own promise-completion state and loops until done.

### 🛠️ Automation & Helper Scripts
Executable scripts bundled inside respective skill folders that your agent can run locally using its terminal/bash tool:
*   [security-guidance](file:///home/mhenke/Projects/claude-code-unplugged/skills/security-guidance/SKILL.md) — Ported security guidance and a regex-based warning script (`python3 scripts/security_reminder_hook.py`) for spotting secrets, raw `innerHTML`, and unsafe serialization.
*   [github-management](file:///home/mhenke/Projects/claude-code-unplugged/skills/github-management/SKILL.md) — Automation scripts copied directly from the Claude Code repository to auto-detect duplicate issues, close stale issues, manage labels, and run sweeps.

### 🔌 Plugin & Agent Development
Skills for building new plugins, agents, hooks, and skills for AI coding assistants:
*   [plugin-dev](file:///home/mhenke/Projects/claude-code-unplugged/skills/plugin-dev/SKILL.md) — Comprehensive guide for developing new CLI plugins from scratch.
*   [plugin-structure](file:///home/mhenke/Projects/claude-code-unplugged/skills/plugin-structure/SKILL.md) — Plugin directory layout, manifest config, component organization, and naming conventions.
*   [plugin-settings](file:///home/mhenke/Projects/claude-code-unplugged/skills/plugin-settings/SKILL.md) — Patterns for user-configurable plugin settings via `.agent/plugin-name.local.md` files with YAML frontmatter.
*   [agent-development](file:///home/mhenke/Projects/claude-code-unplugged/skills/agent-development/SKILL.md) — Agent structure, system prompts, triggering conditions, and development best practices.
*   [hook-development](file:///home/mhenke/Projects/claude-code-unplugged/skills/hook-development/SKILL.md) — Creating PreToolUse/PostToolUse/Stop hooks with prompt-based enforcement patterns.
*   [hookify](file:///home/mhenke/Projects/claude-code-unplugged/skills/hookify/SKILL.md) — Extensible user-configured prompt hooks with a full rule engine and examples.
*   [command-development](file:///home/mhenke/Projects/claude-code-unplugged/skills/command-development/SKILL.md) — Slash command structure, YAML frontmatter fields, dynamic arguments, and user interaction patterns.
*   [skill-development](file:///home/mhenke/Projects/claude-code-unplugged/skills/skill-development/SKILL.md) — Skill structure, progressive disclosure patterns, and best practices for writing new skills.
*   [mcp-integration](file:///home/mhenke/Projects/claude-code-unplugged/skills/mcp-integration/SKILL.md) — Integrating Model Context Protocol (MCP) servers into plugins for external tool and service integration.
*   [writing-rules](file:///home/mhenke/Projects/claude-code-unplugged/skills/writing-rules/SKILL.md) — Hookify rule syntax and patterns for building agent governance rules.

### 🔄 Migration & SDK
*   [claude-opus-4-5-migration](file:///home/mhenke/Projects/claude-code-unplugged/skills/claude-opus-4-5-migration/SKILL.md) — One-shot migration of prompts and API calls to Opus 4.5, including model string updates.
*   [agent-sdk-dev](file:///home/mhenke/Projects/claude-code-unplugged/skills/agent-sdk-dev/SKILL.md) — Guidance for building Agent SDK applications.

---

## ⚙️ Installation

To add this collection to your local workspace, run:

```bash
npx skills add mhenke/claude-code-unplugged
```

After installation, the `code-review` skill is available in your workspace.

---

## 🕊️ Philosophy

* **CLI & Model Agnostic:** Translated from proprietary syntax (`!` command interpolations or Claude-only hooks) into standard English directives that any modern LLM can interpret.
* **Pure Markdown:** Every skill uses the standard `SKILL.md` format. Repo tooling uses Node.js, but the skills themselves are plain Markdown.
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
