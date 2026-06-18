---
version: 1.0
name: devialet-phantom-design-system
description: Design language for the Devialet Phantom mock-brand site. Synthesized from Apple (restraint, product-first) and Lamborghini (darkness, drama, precision). Neither palette nor typeface is borrowed — only the underlying design logic. The 3D speaker IS the site; all UI is infrastructure that recedes.

colors:
  # Surfaces — darkness is the canvas, not a mood
  void: "#000000"
  abyss: "#0a0a0a"
  surface-deep: "#111111"
  surface-raised: "#1a1a1a"
  surface-card: "#1f1f1f"
  surface-chrome: "#2a2a2a"

  # Text
  white: "#ffffff"
  white-muted: "#999999"
  white-ghost: "#7a7a7a"   # ≈4.9:1 on #000 (WCAG AA); was #555 (~2.8:1) which failed the small tracked labels

  # Accent — chrome/iridescence (never decorative; only on interactive elements and metallic UI)
  chrome: "#c8c8c8"
  chrome-bright: "#e8e8e8"
  chrome-dim: "#6a6a6a"

  # Light retail interlude — the single palette flip (Connectivity / FindYourSound /
  # Assurances). Scoped to those sections only; film + acquire + footer stay void.
  paper: "#f4f4f2"        # warm off-white surface, never stark #fff
  paper-deep: "#eaeae7"   # alt bento-tile surface
  ink: "#0a0a0a"          # primary text on paper
  ink-muted: "#5a5a5a"    # secondary text on paper (~6.6:1)
  ink-ghost: "#8a8a8a"    # large/decorative labels on paper

  # Finish palette (only used in the finish-picker section)
  finish-ivory: "#f5f0e8"
  finish-gold: "#c9a96e"
  finish-rosegold: "#c4947a"
  finish-black: "#1a1a1a"

  # Functional
  hairline: "rgba(255,255,255,0.08)"
  overlay-deep: "rgba(0,0,0,0.75)"
  overlay-mid: "rgba(0,0,0,0.5)"

typography:
  # Display — Italiana. Display faces carry the brand voice.
  hero-display:
    fontFamily: "Italiana, Georgia, serif"
    fontSize: 120px
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: "-0.02em"
    textTransform: uppercase
  display-lg:
    fontFamily: "Italiana, Georgia, serif"
    fontSize: 80px
    fontWeight: 400
    lineHeight: 1.0
    letterSpacing: "-0.015em"
    textTransform: uppercase
  display-md:
    fontFamily: "Italiana, Georgia, serif"
    fontSize: 54px
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.01em"
    textTransform: uppercase
  display-sm:
    fontFamily: "Italiana, Georgia, serif"
    fontSize: 40px
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.01em"
    textTransform: uppercase

  # UI type — clean system sans. Never Italiana below 32px.
  label:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.0
    letterSpacing: "0.12em"
    textTransform: uppercase
  caption:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: 13px
    fontWeight: 300
    lineHeight: 1.4
    letterSpacing: "0.04em"
  body:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 300
    lineHeight: 1.6
    letterSpacing: "0"
  button:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.0
    letterSpacing: "0.14em"
    textTransform: uppercase

spacing:
  xxs: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  xxl: 96px
  section: 120px

rounded:
  none: 0px
  # Only one non-zero radius exists: the HUD dot-nav dots
  dot: 50%

components:
  # Buttons — zero border-radius, always
  button-primary:
    backgroundColor: "transparent"
    textColor: "{colors.white}"
    border: "1px solid rgba(255,255,255,0.4)"
    typography: "{typography.button}"
    borderRadius: 0px
    padding: "14px 28px"
    hoverBorder: "1px solid rgba(255,255,255,0.9)"
  button-chrome:
    backgroundColor: "transparent"
    textColor: "{colors.chrome}"
    border: "1px solid {colors.chrome-dim}"
    typography: "{typography.button}"
    borderRadius: 0px
    padding: "14px 28px"
  finish-chip-inactive:
    backgroundColor: "transparent"
    border: "1px solid {colors.white-ghost}"
    typography: "{typography.label}"
    borderRadius: 0px
    padding: "10px 20px"
  finish-chip-active:
    backgroundColor: "transparent"
    border: "1px solid {colors.chrome-bright}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    borderRadius: 0px
    padding: "10px 20px"
  hud-label:
    fontFamily: "{typography.label}"
    textColor: "{colors.white-muted}"
---

## Overview

This is a scroll-driven 3D product site for a premium speaker that doesn't exist. The entire site is one continuous camera take through the Phantom speaker. UI is infrastructure — it earns its presence only by guiding attention, never by decorating.

The design logic is borrowed from two sources: **Apple's product-first restraint** (UI recedes so the object speaks, single accent, no decorative chrome) and **Lamborghini's darkness philosophy** (true black canvas, ALL-CAPS display at extreme scale, surface layering instead of shadows, darkness as whitespace). Neither brand's palette, typeface, or specific components are used — only the underlying discipline.

**The object is the page.** When in doubt, remove UI.

## Surface Philosophy

Darkness is the canvas. `{colors.void}` (#000000) is the true page background. Sections that "change" do so by shifting to `{colors.surface-deep}` (#111111) or `{colors.surface-raised}` (#1a1a1a) — not by changing color. Elevation is communicated through surface lightening, never through box-shadow. Box-shadow does not exist in this system.

The single exception: the 3D renderer itself carries cinematic studio lighting (Lightformer-based). The model is the only thing with real depth and real shadow. Everything else is flat.

### Light retail interlude (the one palette flip)

The post-film body has a single, deliberate flip to light — the **retail interlude**: `Connectivity → FindYourSound → Assurances` render on `{colors.paper}` (#f4f4f2, a warm off-white — never stark `#fff`). This breaks the long black run between pick-color (end of the film) and add-to-cart (the acquire reveal), and lets the page read like a real product/retail site. It is the **only** light region: the 3D film, the acquire reveal, and the footer all stay `void`-black.

Rules inside the interlude:
- Ink tokens only: `{colors.ink}` / `ink-muted` / `ink-ghost` on `paper` / `paper-deep`. No hard-coded grays.
- **Bento is built from layout, not rounding** — varied cell sizes + `paper-deep` tiles + dark hairlines (`black/10`). Sharp corners still hold (the chrome ring is the only curve). A single dark (`void`) card may sit inside the interlude for contrast (the inverted "Find your sound" card).
- Connectivity uses **recognizable third-party marks** (AirPlay / Bluetooth / Spotify / Cast) inline + tracked wordmarks for the rest — monochrome ink, one family. Shown under the concept's trademark disclaimer.
- Still no gradients, no glassmorphism, no box-shadow.

## Typography

**Italiana is the display voice.** It appears at 40px and above only. Below 32px, switch to system-ui. Italiana is always:
- Weight 400 (regular) — the letterforms are distinctive enough, bold is not needed
- ALL-CAPS at hero scale (hero-display, display-lg). Mixed case allowed at display-sm when used as a product descriptor
- Tight line-height (0.92–1.15) — text blocks should feel stamped, not typeset
- Negative letter-spacing — draw the characters closer; they're premium, not airy

**System-ui is the UI voice.** It appears at 11–16px. Always:
- Weight 300 (light) for body and caption — lightness signals premium
- Weight 400 for labels and buttons, always uppercase with wide tracking (+0.12em minimum)
- Never bold (600+) in the UI layer; the 3D model provides all the visual weight the page needs

**The 17px rule from Apple applies:** body copy runs at 16px minimum, not 14px. The extra size signals "reading pace," not "information density."

## Color

**White-on-black only.** The palette has five active roles:
1. `{colors.void}` — page background, always
2. `{colors.white}` — primary text on dark
3. `{colors.white-muted}` — secondary/HUD text, section labels
4. `{colors.chrome}` — the single "accent" — used only on interactive UI elements and to echo the speaker's chrome ring. Never used decoratively
5. Finish palette — only appears in the finish-picker section

**No gradients.** No glassmorphism. No glow overlays on text. The Bloom post-processing already handles the chrome-glint effect on the 3D model — CSS must not try to replicate or complement this with gradients.

## Layout

**Sections occupy full viewports.** Each scroll beat is 100vh (or multiples). Vertical padding inside a section is `{spacing.section}` (120px). Nothing is crowded.

**Text alignment:** centered for hero and product-name beats. Left-aligned for detail/spec beats. Never right-aligned.

**Body copy and model never overlap.** Apple's whitespace principle: the nearest text to the 3D object is at minimum 48px away. When copy and model compete for the same viewport column, copy moves — the model does not.

## Buttons and Interactive Elements

**Zero border-radius on all buttons.** Sharp rectangles only. The speaker's chrome ring is the only curve in this design system.

**Ghost buttons only.** No filled color backgrounds on CTA elements. Buttons are transparent with a border that lightens on hover. This ensures the 3D canvas always reads as the dominant visual element.

**Finish chips** follow the same sharp-rectangle grammar but are smaller and more spaced.

## Elevation and Depth

| Level | Surface | Use |
|---|---|---|
| Abyss | `#000000` | Page background, deepest layer |
| Deep | `#111111` | Alternating section backgrounds |
| Raised | `#1a1a1a` | Cards, panels sitting above the page |
| Card | `#1f1f1f` | Inline content containers |
| Chrome | `#2a2a2a` | HUD elements, active state backgrounds |

Hairlines between elements: `rgba(255,255,255,0.08)` — barely visible, never decorative.

## HUD Chrome Layer

The fixed HUD (wordmark, section index, dot-nav, progress rail) is part of the design system, not an afterthought. HUD elements:
- Text in `{typography.label}` — 11px, uppercase, 0.12em tracking
- Color: `{colors.white-muted}` at rest, `{colors.white}` on active section
- No backgrounds, no borders, no blur — the HUD floats directly on the canvas
- Dot-nav dots: 4px circles, fill on active, hairline border on inactive

## Do's

- Use `{colors.void}` as the true page background — never `#111` as the base
- Display type: Italiana, weight 400, ALL-CAPS, tight line-height
- UI type: system-ui, weight 300, wide tracked labels in 400
- Section rhythm: 100vh beats, 120px internal padding
- Single chrome accent for interactive elements only
- Body copy at minimum 16px, weight 300
- Surface layering for depth — never box-shadow

## Don'ts

- No glassmorphism, no blur backgrounds, no frosted glass
- No gradient text, no gradient backgrounds, no CSS glows
- No border-radius on buttons or cards (dots in dot-nav are the sole exception)
- No filled-color CTA buttons (ghost only)
- No Italiana below 32px
- No text overlapping the 3D model
- No second accent color — chrome is the single accent
- No bold (600+) in the UI layer
- No card carousels
- No Apple blue, no Lamborghini gold — this is neither brand
