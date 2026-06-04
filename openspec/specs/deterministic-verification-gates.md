# Deterministic Verification Gates

**Status:** Finalized  
**Completed:** 2026-06-04

## Summary

Extends prompt-enforced skills with structured XML verification gates and critique steps to simulate deterministic runtime hooks in GUI coding environments (Cursor, Copilot, VS Code) that lack JSON hook runners.

## Problem

AI coding agents are probabilistic systems. In GUI environments, runtime execution policies and hook blocks cannot be enforced. Asking an agent to "remember to scan code" is prone to failure under cognitive load.

## Solution

Three cognitive patterns injected into high-severity skills:

### 1. Gatekeeper Pattern
Injects a mandatory XML `<verification_gate>` block immediately before any tool use or code generation. The agent must output PASS/FAIL for each checklist item before writing code. Applied to: `security-guidance`, `code-review`, `commit-commands`.

### 2. Split-Attention Critique Pattern
Requires the agent to output a draft, critique it in a `<self_critique>` block, then output `<final_code>`. Prevents confirmation bias by breaking generation continuity. Applied to: `feature-dev`.

### 3. Cryptographic Promise Pattern
In iterative loops (`ralph-wiggum`), the agent tracks iteration count and checks its output for a `<promise>` XML block. The loop self-enforces until the promise is met or iteration limit reached.

## Implementation

- `extract.js` extended to dynamically inject verification gate sections during skill compilation
- `PROJECT-DESIGN.md` updated to document all three patterns
- All 22 skills re-validated after injection

## Files Changed

- `scripts/extract.js` — injection logic for gatekeeper pattern
- `PROJECT-DESIGN.md` — documents Gatekeeper, Split-Attention, and Cryptographic Promise patterns
- `skills/security-guidance/SKILL.md` — Pre-Execution Verification Gate injected
- `skills/code-review/SKILL.md` — Pre-Execution Verification Gate injected
- `skills/commit-commands/SKILL.md` — validation checklist injected

## Risk & Mitigations

**Risk:** Model ignores XML gate under high token constraints.  
**Mitigation:** Gate placed at prominent, bold section at top of SKILL.md with strict imperative language.

## Validation

```
node scripts/validate.js   → 22/22 pass
npm test                   → 44/44 pass
```
