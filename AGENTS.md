# Devialet Site — Agent Rules

Read `next/dist/docs/` before writing any Next.js code. This is Next.js 16 — APIs differ from training data.

## Design rules (run on every prompt)

Read `DESIGN.md` and `PRODUCT.md` before touching any UI.

**Never:**
- `font-mono` for UI labels — use `font-sans` (system-ui) with tracking
- `rounded-full` or any border-radius on buttons or cards
- Gradient backgrounds or gradient text (`radial-gradient`, `linear-gradient` on surfaces)
- `text-neutral-*` hard-coded grays — use design tokens (`--color-white-muted`, `--color-chrome`, etc.)
- Glassmorphism, backdrop-blur as decoration, glow overlays
- Purple, blue, or gold as accent colors
- Card carousels or three-equal-feature-card layouts
- Random decorative lights or glow effects on the page layer (the 3D model handles all atmospheric depth)
