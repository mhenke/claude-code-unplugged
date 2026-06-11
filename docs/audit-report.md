# Landing Page Audit

**Target:** `docs/index.html`
**Register:** Product (CLI distribution pipeline)
**Audited:** 2026-06-11

---

## 1. Accessibility (Score: 2)

### Contrast Failures
| Pair | Ratio | Threshold | Verdict |
|------|-------|-----------|---------|
| `--muted (#6c6a64)` on `--surface-card (#efe9de)` | 4.49:1 | 4.5:1 (14px text) | **FAIL** |
| `rgba(255,255,255,0.85)` on `--primary (#cc785c)` | 2.81:1 | 4.5:1 / 3:1 (large) | **FAIL** |
| `rgba(255,255,255,0.95)` on button bg (`#d48c74`) | 2.57:1 | 4.5:1 | **FAIL** |

The entire CTA band (h2, paragraph, button) fails WCAG AA contrast. The blended white-at-opacity approach on the terracotta background doesn't reach sufficient contrast. Muted (#6c6a64) on card (#efe9de) is borderline at 4.49:1 — misses AA by 0.01.

### Semantic / ARIA Issues
- Feature and category card icons (`<svg>`) lack `aria-hidden="true"` — announced as noise to screen readers (12 instances).
- Hamburger toggle button has `aria-label="Toggle menu"` but no `aria-expanded` state.
- Mobile menu (`#mobileMenu`) is toggled by class but has no `role` and no `aria-controls` on the toggle.
- No `aria-current` on active nav links.
- No skip-to-content link.
- No `<main>` landmark wrapping primary content area.
- Category card links use `onclick` handler on the card but the semantic link inside is the "View All →" text — the card itself isn't natively focusable.

### Keyboard
- No visible `:focus-visible` styles defined. Interactive elements rely on browser defaults.

### Passes
- `<html lang="en">`, viewport meta tag, title, meta description — all present and correct.
- Proper heading hierarchy (h1 → h2 → h3/h4).
- All interactive elements use proper `<button>` and `<a>` tags.
- ARIA labels on menu toggle and copy-command button.
- Preconnect to Google Fonts origin — good perf + privacy pattern.

---

## 2. Performance (Score: 4)

### Observations
- Zero images, zero external JS dependencies (besides Google Fonts).
- All CSS is inline in the HTML — zero extra requests.
- Animations use IntersectionObserver — efficient, no scroll jank.
- Icons are inline SVGs (small, cacheable as part of HTML).
- Google Fonts loaded from CDN with `<link rel="preconnect">` — well handled.
- No render-blocking resources beyond the font stylesheet.
- No layout thrashing patterns.

No actionable performance findings.

---

## 3. Theming / Design Token Integrity (Score: 3)

### Strengths
- All colors reference CSS custom properties (tokens) — zero hard-coded values in CSS proper.
- Token naming is consistent (`--canvas`, `--surface-*`, `--on-*` naming convention).
- Typography uses a clear pairing: Cormorant Garamond (display) for headings, Inter (UI) for body, JetBrains Mono for code.

### Token Drift
| Token | DESIGN.md | CSS | Delta |
|-------|-----------|-----|-------|
| h1 size | 56px | 64px | +8px |
| h1 letter-spacing | -1px | -1.5px | -0.5px |
| h2 size | 40px | 48px | +8px |
| h2 letter-spacing | 0px | -0.02em | added |
| h3 size | 32px | 36px | +4px |
| `--primary` | present | `#cc785c` | matches |
| `--canvas` | present | `#faf9f5` | matches |

All headings are consistently larger than the design spec. Letter-spacing values differ — the CSS added tracking on h2. The overall palette matches perfectly.

### Missing
- No dark mode variant. The page has a dark footer/CTA but no system-preference toggle. For a developer tool landing page this is notable.
- Terminal dots use inline `style="background-color: #c64545"` instead of referencing the CSS classes (`.red`, `.yellow`, `.green`) that are defined in the same stylesheet. These hard-coded values duplicate the class definitions.

---

## 4. Responsive Design (Score: 3)

### Breakpoints
- 1024px: 3-column grid → 2-column
- 768px: 2-column → 1-column, nav collapses to hamburger
- Font sizes scale down at 768px (h1: 64→36, h2: 48→32, h3: 36→28)
- Container caps at 1200px with auto margins — handles wide screens cleanly

### Issues
- **Touch targets**: Skill pills (13px font, ~24px height) and category count badges (12px font) are below 44x44px minimum. These are decorative labels, not interactive, so not strictly a violation — but the card they sit in is clickable and the pills appear interactive. Risk of user confusion.
- **Mobile nav**: Hamburger button at 768px breakpoint is 48x48px — valid touch target. Menu fills viewport. No issues.
- No horizontal overflow or fixed-width elements causing scroll issues.

### Passes
- Fluid container with `max-width: 1200px` — handles all widths cleanly.
- Feature cards stack predictably.
- Code window margins scale down on mobile.
- No `clamp()` used (all fixed rem units) — consistent with product register's simpler approach.

---

## 5. Design Quality / Anti-Patterns (Score: 3)

### Absolute Bans Check (impeccable)
| Pattern | Found | Notes |
|---------|-------|-------|
| Gradient text | No | |
| Glassmorphism | No | |
| Card grids with identical content | Partial | Feature section has 6 cards (icon + heading + paragraph) — justified for a features list, content varies enough |
| Tiny uppercase tracked eyebrow | No | Section headers use `kicker` pattern at 14px sans-serif uppercase, but it's not the aggressive tracked-eyebrow anti-pattern |
| Numbered section markers | No | |
| Border + shadow with blur ≥ 16px | No | Max shadow blur is 3px |
| border-radius ≥ 32px | No | Max 16px on hero card; pills use 9999px (acceptable) |
| Hand-drawn SVG | No | Icons are clean stroke-style (Feather-esque) |
| `repeating-linear-gradient` | No | |
| Meta-criticism copy | No | |

### Product Register Compliance
- **One family for UI**: Headings use Cormorant Garamond (display serif), body uses Inter. This is a marketing landing page, so the pairing is appropriate — pure product UI would want a single family.
- **No fluid clamp sizing**: All rem units. Good.
- **Decorative motion**: Minimal fadeInUp on scroll via IntersectionObserver. No orchestrated load animations. Tasteful restraint.
- **Terracotta restraint**: `--primary` (#cc785c) used meaningfully — CTA band, feature card icons. Not over-applied.

### Presentation Issues
- "22 Skills, 5 Categories" heading but **6 category cards** visible. The "Plugin & Agent Dev" and "More Plugin Dev" are split across two cards — visually counts as 6, text says 5. Inconsistency.
- Counter text for "More Plugin Dev" shows `—` instead of a number — inconsistent presentation pattern.
- Terminal code window lists skills (frontend-design, etc.) that reflect the original Claude Code Unplugged source. The current project may not have these exact skills — potential drift from actual content.

---

## Summary

| Dimension | Score | Key Finding |
|-----------|-------|-------------|
| Accessibility | **2** | CTA band contrast fails WCAG AA; missing ARIA on icons and mobile menu |
| Performance | **4** | Minimal external deps, inline CSS, efficient animations |
| Theming | **3** | Palette matches design spec; heading tokens drifted larger |
| Responsive | **3** | Clean breakpoints; touch targets borderline on pill elements |
| Anti-Patterns | **3** | Clean execution; card count inconsistency; terminal content drift |

**Overall: 3.0** — Solid landing page for a developer tool. The contrast issues in the CTA band are the most actionable finding (impactful + high visibility). Design token drift is minor but worth reconciling.
