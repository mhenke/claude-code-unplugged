## ADDED Requirements

### Requirement: Extraction Command Line Interface
The extraction utility SHALL provide a command-line interface or executable script that accepts a `--source` parameter pointing to the root of the source `anthropics/claude-code` repository, and a `--target` parameter specifying the output directory.

#### Scenario: Successful execution with valid parameters
- **WHEN** the extraction script is executed with valid `--source` and `--target` directory paths
- **THEN** the utility initializes the output structure and successfully migrates and refactors all skills, commands, and scripts.

### Requirement: Structure and Refactoring Mapping
The utility SHALL map and reformat source assets into the target directory matching the flat Agent Skills layout, where:
- Direct skills (`frontend-design`, `claude-opus-4-5-migration`) are copied directly.
- Claude Code slash commands (e.g. in `plugins/commit-commands/commands`) are merged and reformatted into a single `SKILL.md` or `WORKFLOW.md` document.
- Claude Code hooks (e.g. `PreToolUse` or `Stop` hooks in `plugins/security-guidance`) are rewritten as instructions under `## Pre-Execution Verification` or `## Quality Verification` sections within the skill's `SKILL.md`, and any associated python/bash script files are placed in a nested `scripts/` directory inside that skill.
- Internal repository scripts are bundled under a new `github-management` skill folder (`skills/github-management/scripts/`), with an accompanying `SKILL.md` file instructing how the agent runs them.

#### Scenario: Verify extracted outputs
- **WHEN** the extraction utility finishes running
- **THEN** the target directory contains a flat structure containing only `skills/` (each with `SKILL.md`, and optional `scripts/` or `references/`), completely free of platform-specific CLI-only configurations or runtime hooks.
