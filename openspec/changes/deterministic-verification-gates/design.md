## Context

Since GUI-based coding environments (Cursor, Copilot, VS Code) lack JSON hook runners or interception handlers, we must rely on prompt instructions to enforce lifecycle security and workflow constraints. To avoid probabilistic failure (where the agent ignores rules), we implement a structured prompt engineering design that acts as a cognitive state-machine gate.

## Decisions

### 1. The Gatekeeper Pattern Injection
- **Decision**: Inject a mandatory XML `<verification_gate>` section immediately before any tool use or code generation in high-severity skills (like `security-guidance`, `code-review`, and `commit-commands`).
- **Rationale**: Forcing the model to output a checklist (PASS/FAIL) before writing code fills its immediate context window with the safety checklist evaluation. This changes the generation probability, preventing the model from outputting insecure code by default.

### 2. The Split-Attention Critique Pattern Injection
- **Decision**: Inject instructions requiring the agent to output a draft code block, critique it against style and bug rules in a `<self_critique>` block, and only then output the `<final_code>` block.
- **Rationale**: Breaks generation continuity and addresses confirmation bias. The model must write, step back to analyze its output, and rewrite, leading to higher code quality.

### 3. Dynamic Compilation Injection in `extract.js`
- **Decision**: Extend [extract.js](file:///home/mhenke/Projects/claude-code-unplugged/scripts/extract.js) to:
  - Add standard pre-execution headers to specific skills.
  - Re-run and overwrite the targets in `skills/`.
- **Rationale**: Keeps the source `anthropics/claude-code` files as read-only. The transformation happens dynamically during compilation.

### 4. Copying Hookify and Ralph-Wiggum Script Assets
- **Decision**: Copy all python hook scripts and the `core/` rule engine for `hookify` to `skills/hookify/scripts/`, local rules examples to `skills/hookify/examples/`, and setup/stop-hook bash files for `ralph-wiggum` to `skills/ralph-wiggum/scripts/`.
- **Rationale**: Ensures the original executable utilities, logic engines, and examples are preserved as portable scripts inside their respective folders.

### 5. Cognitive Loop Self-Enforcement for Ralph-Wiggum
- **Decision**: Translate the original `stop-hook.sh` feedback loop behavior into a detailed prompt directive in `skills/ralph-wiggum/SKILL.md`. The agent is instructed to read the state file, check for the `<promise>` XML tag, increment iteration, and output a manual continuation block (self-blocking exit) if not completed.
- **Rationale**: Mimics the exact loop mechanism cognitively within GUI editors (like Cursor) without depending on CLI-level hooks.

## Risks / Trade-offs

- **[Risk]**: Model ignores the XML verification gate when under high token constraints or long conversations.
  - **Mitigation**: Place the verification gate instructions in a prominent, bold, bordered section at the very top of the `SKILL.md` file, using strict imperative language (`"You are FORBIDDEN from..."`).
