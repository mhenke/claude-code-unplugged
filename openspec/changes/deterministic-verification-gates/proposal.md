## Why

AI coding agents are probabilistic systems. In GUI environments (like Cursor or Copilot Chat), we cannot enforce runtime execution policies or hook blocks. Asking an agent to "remember to scan code" or "loop until complete" is prone to failure under cognitive load. 

To bridge this runtime gap, we need to make the prompt-enforced hooks as **deterministic** as possible. By structuring the prompt around validation state-machines (like Gatekeeper checklists and Split-Attention Critique blocks), we force the model's attention mechanism to execute verification checks before generating final code blocks, ensuring safety, correctness, and reliability in any AI coding assistant.

## What Changes

- Document the **Gatekeeper** and **Split-Attention Draft** patterns inside [PROJECT-DESIGN.md](file:///home/mhenke/Projects/claude-code-unplugged/PROJECT-DESIGN.md).
- Update the extraction script [extract.js](file:///home/mhenke/Projects/claude-code-unplugged/scripts/extract.js) to dynamically inject structured XML verification gates and critique steps into generated `SKILL.md` files:
  - `security-guidance`: Inject the `Pre-Execution Verification Gate` (checking for secrets, innerHTML, path traversal).
  - `commit-commands` & `code-review`: Inject validation checklist templates.
  - `feature-dev`: Inject the `Phase Verification Gates`.
- Re-run the extraction script and validate all 22 skills.

## Capabilities

### New Capabilities
- `deterministic-prompt-hooks`: Enhances prompt-enforced skills with strict verification gates and critique blocks to simulate deterministic runtime hooks.

## Impact

- **Build/Dev**: Modifies only `extract.js` and documentation. Does not introduce any new runtime or build dependencies.
- **Generated Skills**: Updates the instruction structures inside the generated markdown skills.
