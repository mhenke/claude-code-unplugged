## Requirements

### Requirement: Pre-Execution Verification Gate Injection
The extraction utility SHALL dynamically inject a `## 🔒 Pre-Execution Verification Gate` section into the following compiled skills:
- `skills/security-guidance/SKILL.md`
- `skills/commit-commands/SKILL.md`
- `skills/code-review/SKILL.md`

This section must require the agent to output a structured XML `<verification_gate>` before executing tools or code edits.

#### Scenario: Verification Gate Check
- **WHEN** the extraction utility generates the `security-guidance` skill
- **THEN** the output `SKILL.md` contains a prominent section instructing the agent to evaluate `secrets`, `input_sanitization`, and `paths` checks in a `<verification_gate>` block.

---

### Requirement: Pattern Documentation
The target repository design document (`PROJECT-DESIGN.md`) SHALL be updated to explain the Gatekeeper, Split-Attention Draft, and Cryptographic Promise patterns, making the repository's design guidelines consistent.

#### Scenario: Documentation Check
- **WHEN** the extraction utility completes
- **THEN** the `PROJECT-DESIGN.md` file contains a dedicated section detailing "Deterministic Prompt-Enforced Hooks".

---

### Requirement: Hookify and Ralph-Wiggum Hook Porting and Cognitive Enforcement
The extraction utility SHALL copy hook files, helper scripts, and examples for both `hookify` and `ralph-wiggum` into their target directories:
- `skills/hookify/scripts/` (including `core/config_loader.py` and `rule_engine.py`)
- `skills/hookify/examples/` (local rule example files)
- `skills/ralph-wiggum/scripts/` (stop-hook.sh and setup-ralph-loop.sh)

Additionally, the generated `SKILL.md` files for both skills SHALL include cognitive prompt-enforced execution instructions:
- `skills/ralph-wiggum/SKILL.md` must instruct the agent to read `.claude/ralph-loop.local.md`, check iteration limits, verify the completion promise XML block, and manually prompt the user to continue (self-blocking exit) if incomplete.
- `skills/hookify/SKILL.md` must instruct the agent to cognitively scan `.local.md` files before tool execution or run the ported rule checker scripts.
