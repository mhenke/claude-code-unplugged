---
name: Claude Code Unplugged
description: Portable agent skills extracted from Claude Code
colors:
  terracotta: "#cc785c"
  terracotta-soft: "#e8b4a0"
  sage: "#6b8f71"
  sage-soft: "#a8c4a8"
  ink: "#1a1a1a"
  canvas: "#faf9f5"
  surface: "#ffffff"
  surface-soft: "#f2f0eb"
  surface-dark: "#1e1e1e"
  surface-dark-elevated: "#2a2a2a"
  on-dark: "#e8e6e1"
  on-dark-soft: "#9e9b95"
  border: "#e2ddd5"
  text-muted: "#656358"
  status-red: "#c64545"
  status-yellow: "#d4a017"
  status-green: "#5db872"
typography:
  display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "64px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-1.5px"
  headline:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "48px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-1px"
  title:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "36px"
    fontWeight: 500
    lineHeight: 1.2
  body:
    fontFamily: "Inter, -apple-system, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.4
  code:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "8px"
  md: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
  xxl: "80px"
components:
  button-primary:
    backgroundColor: "{colors.terracotta}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "14px 28px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "14px 28px"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-soft}"
  nav-link:
    textColor: "{colors.text-muted}"
    typography: label
    padding: "8px 16px"
  nav-cta:
    backgroundColor: "{colors.terracotta}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "10px 24px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  skill-pill:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "6px 14px"
  code-window:
    backgroundColor: "{colors.surface-dark}"
    rounded: "{rounded.md}"
  install-command:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.sm}"
    padding: "14px 24px"
---

# Design System: Claude Code Unplugged

## 1. Overview

**Creative North Star: "Agent Skills"**

A collection of battle-tested agent workflows, extracted from Claude Code and made portable across every AI coding assistant. The design mirrors the clarity and restraint of Anthropic/Claude's visual language — flat surfaces, warm neutral backgrounds, tonal layering, and typography that lets content lead. Every decision serves the idea of a well-organized professional toolset, not a branded destination.

The interface is confident without being loud. It whispers "this is solid engineering" rather than shouting "look at me." Warm off-white canvas grounds the page, terracotta provides selective emphasis, and generous whitespace gives each section room to breathe.

**Key Characteristics:**
- Warm off-white canvas (`#faf9f5`) as the foundation
- Flat surfaces — no box-shadows, depth through tonal layering
- Serif display type (Cormorant Garamond) for authority and warmth
- Terracotta accent used sparingly — emphasis through restraint
- Terminal-style code windows as the signature visual motif
- Generous whitespace and clear section hierarchy

## 2. Colors

The palette is warm and grounded, inspired by natural materials rather than synthetic neon. Three named color characters carry the system.

### Primary: Terracotta
- **Terracotta** (`#cc785c`): Primary actions, interactive accents, buttons, and links. Warm without being aggressive. Suggests craftsmanship and reliability.
- **Terracotta Soft** (`#e8b4a0`): Hover states, background fills that need a warm tint.
- **Terracotta Dark** (`#9a4f35`): WCAG AA contrast variant of terracotta — used where `#cc785c` fails 4.5:1 on light backgrounds. Applied to kicker text on canvas and feature card icons on card surfaces.

### Secondary: Sage
- **Sage** (`#6b8f71`): Secondary accents, file-status indicators, success states. Grounds the warmer terracotta with a calm, natural counterpoint.
- **Sage Soft** (`#a8c4a8`): Accent background fills.

### Neutral
- **Canvas** (`#faf9f5`): Page background — a warm off-white that makes the palette feel tactile and intentional.
- **Surface** (`#ffffff`): Cards, code window backgrounds, elevated containers.
- **Surface Soft** (`#f2f0eb`): Hover states, chip backgrounds, subtle dividers.
- **Surface Card** (`#efe9de`): Warm-tinted card surface, slightly darker than surface-soft. Used for cards that need more visual weight against the canvas.
- **Surface Dark** (`#1e1e1e`): Footer, CTA band, code window — dark sections that need visual weight.
- **Surface Dark Elevated** (`#2a2a2a`): Borders and subtle elevation within dark surfaces.
- **Ink** (`#1a1a1a`): Body text and headings on light surfaces. High-contrast and authoritative.
- **On-Dark** (`#e8e6e1`): Primary text on dark surfaces.
- **On-Dark Soft** (`#9e9b95`): Secondary text, metadata on dark surfaces.
- **Border** (`#e2ddd5`): Dividers, card outlines, subtle structural lines.
- **Text Muted** (`#656358`): De-emphasized text, secondary information.

### Status
- **Red** (`#c64545`), **Yellow** (`#d4a017`), **Green** (`#5db872`): Terminal window dot colors and status indicators.

### Named Rules
**The Restraint Rule.** Terracotta is used on no more than 10% of any given surface. Its rarity is what makes it effective — the moment it becomes common, it stops being an accent.

**The Warm Canvas Rule.** Pure white (`#ffffff`) is reserved for card surfaces. The page background is always the warm canvas (`#faf9f5`) — never flat white, never a tinted gradient. The canvas IS the foundation.

## 3. Typography

**Display Font:** Cormorant Garamond (Georgia, serif fallback) — 500 weight
**Body Font:** Inter (-apple-system, sans-serif fallback) — 400 weight
**Label/Mono Font:** JetBrains Mono (monospace fallback) — 400 weight for code; Inter 500 weight for UI labels

**Character:** A restrained serif + sans pairing. Cormorant Garamond brings warmth and editorial authority to headings without being decorative. Inter is clean, highly readable, and fades into the background — exactly what body text should do. JetBrains Mono signals "this is code" at a glance. The pairing is not flashy. It is correct.

### Hierarchy

- **Display** (500, 64px, 1.2, -1.5px letter-spacing): Hero headlines only. Never used for subheadings or body text.
- **Headline** (500, 48px, 1.2, -1px letter-spacing): Section titles. The primary voice for page structure.
- **Title** (500, 36px, 1.2): Sub-section headings, modal titles, card titles.
- **Body** (400, 17px, 1.6): All continuous text. Max line length ~70ch.
- **Label** (500, 14px, 1.4): Navigation links, button text, chip labels, metadata.
- **Code** (400, 14px, 1.6): Terminal output, code blocks, install commands, inline `<code>`.

> **Landing page display sizes:** The marketing landing page (`docs/index.html`) uses larger display sizes (h1: 64px, h2: 48px, h3: 36px) than the base design system, intentionally increased for marketing impact and visual hierarchy on hero/section headings.

## 4. Elevation

Flat by default — mirroring Anthropic/Claude's design language. No box-shadows exist in the system.

Depth is communicated entirely through tonal layering: surfaces shift between `canvas` (`#faf9f5`), `surface` (`#ffffff`), `surface-soft` (`#f2f0eb`), and `surface-dark` (`#1e1e1e`). The darkest surface is always the most "elevated" in the visual hierarchy — the dark footer and CTA band sit below the content, while the warm canvas is the foundation everything sits on.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows are never used to indicate depth. The color transition between surface layers is the only elevation signal. If it needs a shadow, the design is wrong.

## 5. Components

### Buttons
- **Shape:** Gently rounded corners (8px).
- **Primary:** Terracotta (`#cc785c`) background, white text, 48px height, 14px 28px padding. Hover: darkens to Ink (`#1a1a1a`). Transition: 0.2s ease.
- **Secondary:** Canvas (`#faf9f5`) background, Ink text, 48px height, same padding. Hover: softens to surface-soft (`#f2f0eb`).
- **Font:** Inter 500, 14px.

### Cards / Containers
- **Corner Style:** Rounded (12px).
- **Background:** Surface (`#ffffff`).
- **Shadow Strategy:** None — flat. Adjacent cards separate through the warm canvas gap (24px).
- **Border:** None.
- **Internal Padding:** 24px.

### Navigation
- **Style:** Fixed top bar, 40px height, blurred background (`backdrop-filter: blur(8px)`). Logo + wordmark on left, links on right.
- **Typography:** Inter 500, 14px. Link color: text-muted (`#656358`). No underline on default state.
- **Active/Current:** Ink (`#1a1a1a`) or CTA (terracotta button pill).
- **Mobile (<768px):** Links hidden, hamburger menu toggles a full-width overlay menu.
- **Landing page override:** The marketing landing page uses 64px nav height for increased presence and touch-target comfort on mobile.

### Code Window
- **Style:** Terminal-style card with three macOS dot indicators (red/yellow/green, 8px circles, 6px gap) in the header bar. Filename label on the right side of the header.
- **Background:** Surface-dark (`#1e1e1e`) for the window frame, code renders in on-dark (`#e8e6e1`).
- **Border Radius:** 12px.
- **Typography:** JetBrains Mono 14px. Comment lines dimmed (on-dark-soft `#9e9b95`). Command prefix in a distinct color.

### Skill Pills
- **Style:** Small label chips listing skill names within a category card.
- **Background:** Surface-soft (`#f2f0eb`), Ink (`#1a1a1a`) text.
- **Shape:** 8px radius, compact padding (6px 14px).
- **Typography:** Inter 14px.

### Install Command
- **Style:** Inline code block with a copy-to-clipboard button. Monospace display.
- **Background:** Surface-dark (`#1e1e1e`), on-dark (`#e8e6e1`) text.
- **Shape:** 8px radius, 14px 24px padding.
- **Typography:** JetBrains Mono 14px.

### CTA Band
- **Style:** Full-width section, centered content. Not a card — bleeds edge-to-edge.
- **Internal elements:** Headline (center-aligned, on-dark), description text (on-dark-soft), install command centered below, secondary button below that.
- **Landing page override:** The marketing landing page uses terracotta (`#cc785c`) instead of surface-dark. This is a deliberate exception: the terracotta band serves as the page's emotional peak and call-to-action anchor. The Restraint Rule exemption is documented because the CTA band is the single conversion moment on the page.

### Feature List
- **Style:** Two-column icon+text layout for the marketing landing page features section. No card backgrounds — uses the canvas directly. Each item is an icon + title + description in a horizontal row. Creates visual variety from the category cards below.
- **Columns:** 2-column grid on desktop, 1-column on mobile
- **Gap:** 40px vertical, 64px horizontal

### Stats Divider
- **Style:** Horizontal stat row between sections. Centered numbers with labels, separated by thin vertical dividers. Uses hairline borders top and bottom. Cormorant Garamond for numbers, Inter uppercase for labels.

## 6. Do's and Don'ts

### Do:
- **Do** use the warm canvas (`#faf9f5`) as the page background — never flat white.
- **Do** keep surfaces flat. Use tonal layering for hierarchy.
- **Do** use terracotta sparingly — the active accent on <10% of any surface.
- **Do** let content breathe with generous whitespace (80px section padding, 24px card gap).
- **Do** use the terminal code window as the signature visual motif — it signals "this is a developer tool."
- **Do** mirror Anthropic/Claude's visual restraint — clean lines, warm neutrals, clear hierarchy.

### Don't:
- **Don't** use box-shadows, glassmorphism, or gradient overlays. This is a flat system.
- **Don't** overuse terracotta. When buttons, links, icons, and borders are all terracotta, nothing is emphasized.
- **Don't** use dark mode with purple gradients or neon accents (from PRODUCT.md: avoid generic "AI tool marketing" patterns).
- **Don't** use pure white (`#ffffff`) as the page background — that's what canvas is for.
- **Don't** use Sans-serif for display headings — Cormorant Garamond is the designated heading face.
- **Don't** add decorative illustrations or 3D renders. The code window IS the visual.
- **Don't** break the warm palette with cool grays or blue-grays. Neutrals stay warm.

## 7. Landing Page Exceptions

The marketing landing page (`docs/index.html`) intentionally deviates from the base design system in these ways:

- **Nav height:** 64px (vs 40px) — increased for presence and mobile touch targets
- **CTA band color:** Terracotta (`#cc785c`) instead of surface-dark — the band serves as the page's emotional peak and conversion anchor. Restraint Rule exemption documented in the CTA Band component spec.
- **Feature layout:** Two-column icon+text list instead of card grid — creates visual variety from the category cards below
- **Stats divider:** Horizontal stat row between features and categories — breaks the card-tunnel monotony
