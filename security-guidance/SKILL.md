---
name: security-guidance
description: Security warnings, patterns scanner, and LLM diff security reviews
---

# Security Guidance

# security-guidance

Security review for AI-generated code. Three layers:

1. **Pattern warnings** — instant regex-based reminders on `Edit`/`Write` for ~25 known-dangerous patterns (`yaml.load`, `torch.load(weights_only=False)`, `pickle.load` on untrusted data, raw `innerHTML`, hardcoded secrets, etc.).
2. **LLM diff review** — when the agent finishes a turn, the plugin sends the diff to a fast LLM call (Opus 4.7 by default) and feeds high-severity findings back to Claude so it can fix them before you see the response.
3. **Agentic commit review** — on `git commit`, an SDK-driven reviewer reads related files (`Read`/`Grep`/`Glob`) to trace data flow across the codebase, catching multi-file vulnerabilities pattern matching misses (IDOR, auth bypass, cross-file SSRF).

Findings cover common web-vulnerability classes — injection, XSS, SSRF, hardcoded secrets, IDOR, auth bypass, unsafe deserialization, and path traversal among others.

## Install

```
/plugin install security-guidance@claude-plugins-official
```

Marketplace ships enabled by default in coding assistant — no setup beyond having the CLI itself.

## Prerequisites

- coding assistant CLI ≥ v2.1.144
- Python 3.8+ on `PATH` (`python3`, `python`, or `py -3` — the plugin picks the first that works)
- A working API path (subscription, API key, or 3P provider config)

## Configuration

All configuration is via environment variables. None are required for default behavior.

### Selecting a model

```bash
# 1P / gateway: a canonical model id
SECURITY_REVIEW_MODEL=claude-opus-4-7   # default

# Bedrock: use the inference-profile id
SECURITY_REVIEW_MODEL=us.anthropic.agent-opus-4-7

# Vertex: use the Vertex date-tag form
SECURITY_REVIEW_MODEL=claude-opus-4-7@20260218
```

`SECURITY_REVIEW_MODEL` controls the LLM diff review. `SG_AGENTIC_MODEL` (same syntax) controls the agentic commit reviewer; defaults to the same model.

### Enabling/disabling layers

| Variable | Default | What it does |
|---|---|---|
| `SECURITY_GUIDANCE_DISABLE=1` | unset | Kill switch — disables the entire plugin |
| `ENABLE_PATTERN_RULES=0` | on | Disable layer 1 (regex pattern warnings) |
| `ENABLE_CODE_SECURITY_REVIEW=0` | on | Disable all LLM reviews (Stop hook + commit/push) |
| `ENABLE_STOP_REVIEW=0` | on | Disable only the Stop-hook diff review, keeping commit/push reviews. Useful for multi-agent / shared-worktree setups where another agent can move HEAD between a worker's turns |
| `ENABLE_COMMIT_REVIEW=0` | on | Disable layer 3 (agentic commit review) |

### Higher-recall mode

```bash
SG_DUAL_OR=on   # default off
```

Runs two parallel review calls and unions the findings. Catches a few percentage points more vulnerabilities in our testing, at roughly 2× the API cost per review. Most users don't need it.

## Org-specific policies

Drop a `security-guidance.md` in any of:

- `~/.agent/security-guidance.md` — user-wide rules
- `<project>/.agent/security-guidance.md` — project rules, intended to be committed
- `<project>/.agent/claude-security-guidance.local.md` — local overrides, intended to be `.gitignore`'d

All three are loaded and concatenated into the LLM diff review's prompt in the order user → project → project-local. If the combined size exceeds the 8 KB prompt budget, the tail is truncated, so user-wide rules are kept and project-local rules are dropped first. The agentic commit reviewer (layer 3) does not currently read this file. Example:

```markdown
# Acme security rules

- All SELECTs against the `customers` or `orders` tables MUST go through `db.replica`,
  never `db.primary`. Primary is for writes only.
- Background jobs must not use the user-context auth token; they get
  service-account creds from `jobs.get_service_account()`.
- Calls to `requests.get(url)` with a user-controlled `url` need
  the SSRF-allowlist wrapper at `acme.net.safe_request`.
```

Built-in rules cover common web-vulnerability classes without it — `security-guidance.md` is for things specific to your codebase that the model can't infer.

## Privacy and data handling

The plugin sends data to a model endpoint to perform its reviews. Specifically, each Stop-hook diff review transmits the changed file paths, the diff hunks, and the relevant file contents in the diff; each agentic commit review additionally transmits any files the reviewer pulls in via `Read`/`Grep`/`Glob` while tracing data flow. Your `security-guidance.md` contents (user, project, and local) are appended to the prompt on every review, so don't put secrets in it.

Where that data goes depends on your coding assistant configuration:
- **Default (Anthropic API / subscription):** sent to `api.anthropic.com` and handled under Anthropic's [Commercial Terms](https://www.anthropic.com/legal/commercial-terms) and [Privacy Policy](https://www.anthropic.com/legal/privacy).
- **LLM gateway** (`ANTHROPIC_BASE_URL` set): sent to your gateway URL instead. The gateway operator's terms apply.
- **3rd-party providers** (Bedrock / Vertex / Foundry / Mantle): sent to your configured provider endpoint. The provider's data-handling terms apply (e.g., AWS / GCP / Azure).

The plugin writes its own debug log to `~/.agent/security/log.txt` (override with `SECURITY_GUIDANCE_DEBUG_LOG`). The log contains diffstate metadata and finding categories — no full file contents or model prompts — and rotates at 1 MB. Nothing is uploaded.

## Limitations

This is a best-effort assistive tool, not a guarantee. Treat findings as suggestions, not as a substitute for human code review, SAST/DAST, dependency scanning, or pen-testing. The reviewer can miss vulnerabilities, produce false positives, and may behave differently across codebases, languages, and model versions. **No warranty is provided** — use is subject to Anthropic's [Commercial Terms](https://www.anthropic.com/legal/commercial-terms).

## Troubleshooting

**Plugin doesn't seem to fire** — check that `~/.agent/security-guidance.md` (or hook activity) shows in debug logs. Run coding assistant with debug mode enabled and grep for `security_reminder_hook`. The plugin also writes its own log to `~/.agent/security/log.txt`.

**Review never finds anything** — verify your API path works. On 3P providers, check `SECURITY_REVIEW_MODEL` is set to a provider-specific id (not a bare `claude-opus-4-7`). On LLM gateways, check the gateway's logs for `POST /v1/messages` traffic from the plugin.

**Too many false positives** — drop `SECURITY_REVIEW_MODEL` to a faster/cheaper model and re-evaluate; if precision is the priority, use your most capable model.

**Want to silence a specific finding** — add a comment to the line explaining why it's safe; the LLM reviewer treats inline justifications as exclusions. For systemic exclusions, document them in your `security-guidance.md`.

## Reporting issues

Open an issue on the [security-guidance plugin repo](https://github.com/anthropics/claude-code/issues) with:
- The coding assistant CLI version (`assistant --version`)
- Provider setup (1P / Bedrock / Vertex / LLM gateway / etc.)
- A minimal repro diff
- The relevant section of `~/.agent/security/log.txt`

---

## Pre-Execution Verification (PreToolUse)

Before executing commands, creating files, or editing code, you should review your work for common security pitfalls. You can run the built-in python script helper using your bash tool to scan files for dangerous patterns:

```bash
python3 scripts/security_reminder_hook.py
```

### Dangerous Patterns Checked
The pattern rules scanner checks for:
- Raw `innerHTML` usage (XSS vulnerability)
- Unsafe yaml/pickle serialization (`yaml.load`, `pickle.load` without restrictions)
- Unsafe PyTorch model loading (`torch.load(weights_only=False)`)
- Hardcoded api keys, secrets, and auth credentials
- SQL injections and shell command injection patterns
- Path traversal issues and unsafe file path operations

---

## Quality Verification Checklist (Stop / PostToolUse)

Upon completing code writing or editing:
1. Conduct a background review of your diff to check for vulnerability introductions.
2. If any changes touch critical web interfaces, ensure input validation is applied.
3. Review database commands to prevent auth bypass or IDOR.
4. Address or acknowledge any security warnings found during execution.


## 🔒 Pre-Execution Verification Gate

Before executing any commands, creating files, or editing code, you MUST output a structured XML `<verification_gate>` block evaluating the following checks:
1. `secrets`: Check for hardcoded API keys, secrets, credentials, or certificates. (PASS/FAIL)
2. `input_sanitization`: Check for unsafe user input handling (e.g., innerHTML, eval, unvalidated parameters). (PASS/FAIL)
3. `paths`: Check for path traversal vulnerabilities or directory escape attempts. (PASS/FAIL)

Example output format:
```xml
<verification_gate>
  <secrets>PASS</secrets>
  <input_sanitization>PASS</input_sanitization>
  <paths>PASS</paths>
</verification_gate>
```
Do not execute tools or code edits until you have output this verification gate.
