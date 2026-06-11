# Product — claude-code-unplugged

## Product

Portable agent capabilities extracted from Claude Code, made available for any AI coding assistant ecosystem. A collection of 22+ skills packaged as standard `SKILL.md` files, distributed via `npx skills add`. Zero npm dependencies — pure Node.js (CommonJS), vanilla JS, Markdown.

**Target audience:** Developers using AI coding assistants (Claude Code, Copilot, Gemini CLI, Codex, etc.) who want to extend their capabilities with curated, portable skills. Secondary audience: skill/plugin developers building for the multi-assistant ecosystem.

## Register

**Product.** The extraction pipeline, validation tooling, and distribution mechanism are the primary surface. The landing page (GitHub Pages) is secondary — it serves the product, not the other way around. The existing DESIGN.md is a source artifact (Anthropic/Claude.com's visual system), not this project's own design system.

## Design Principles

1. **Portability First** — Skills must work in any AI coding assistant without modification. Platform lock-in is failure. Every skill passes through the platform-neutrality transformation pipeline.
2. **Familiarity** — The tool should disappear into the task. Follow established conventions for CLIs, Markdown, YAML frontmatter, and npm-style distribution. Users should not need to learn a new mental model.
3. **Fidelity** — Extraction preserves source behavior. Only platform-neutrality transformations are permitted (Claude Code → coding assistant, `.claude/` → `.agent/`, etc.). The prime directive: do not alter behavior of extracted source artifacts.
4. **Simplicity** — Zero npm dependencies. Pure Node.js (CommonJS), vanilla JS, Markdown. Every addition must earn its complexity. The distribution channel is the GitHub repo itself — no build step, no registry.
5. **Discoverability** — Skills are easy to find, understand, and install. `skills.json` is the catalog; frontmatter (name + description) is the label. Git-native distribution: `npx skills add <owner>/<repo>/skills/<name>`.
6. **Verifiability** — Every skill passes deterministic validation. Tests enforce platform-neutrality, frontmatter correctness, and structural integrity. Verification gates inject quality checklists into high-severity skills.
7. **Provenance** — Every skill carries its origin (source repo, commit, version) so users know where it came from and can trace it back. Version and source metadata live in `skills.json`, not frontmatter.

## Visual Identity Constraints

No visual identity — this is a CLI tool composed of Markdown files and JavaScript scripts. The only visual surface is the landing page (`docs/index.html`), which follows neutral, developer-friendly design.

- No brand colors, logos, or iconography defined. The project does not have (and does not need) a visual brand.
- If the landing page is redesigned, it should follow product register conventions: restrained, utility-focused, developer-audience appropriate.
- Existing DESIGN.md is a preserved source artifact — not a design system to follow or extend.
