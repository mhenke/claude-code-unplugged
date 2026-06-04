## Why

Many high-quality AI agent capabilities, workflows, commands, and automation scripts are currently embedded inside Claude Code plugins and internal repository scripts. Repackaging these assets into a flat, platform-neutral skills format compatible with `npx skills add` allows other AI coding assistants (such as Cursor, Gemini CLI, Qwen Code, OpenCode, and OpenClaude) to reuse them, removing platform lock-in and reducing duplicate effort.

## What Changes

- Create a new directory and repository structure for **Claude Code Unplugged**.
- Implement an extraction utility script (`scripts/extract.ts`) to automate pulling workflows, skills, commands, and scripts from the `anthropics/claude-code` repository.
- Reformat the extracted slash commands, specialized agents, and hooks into standard, platform-neutral `SKILL.md` files (with nested `scripts/` and `references/` folders) for the `skills/` directory.
- Reformat internal repository maintenance scripts (like duplicate issue closure) into a bundled `github-management` skill.
- Provide a standard `README.md` and `PROJECT-DESIGN.md` in the target repository for `npx skills add` installation guidance.

## Capabilities

### New Capabilities
- `skills-extraction`: Automates the extraction, directory mapping, and translation of Claude Code plugins/scripts into a flat Open Agent Skills format compatible with `npx skills add`.

### Modified Capabilities
*(None)*

## Impact

- **Build/Dev Dependencies**: Adds `tsx` or TypeScript execution capabilities for the extraction script.
- **Source Artifacts**: Does not affect the production runtime of the official Claude Code CLI; this is purely a standalone extraction workspace.
- **Distribution**: Establishes a new standalone Git repository as the target for `npx skills add` downloads.
