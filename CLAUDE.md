# Devialet Phantom — `devialet-site`

Scroll-driven 3D product film for the (mock) **Devialet Phantom** speaker — one continuous, scroll-scrubbed camera take around a real-time WebGL model, with an audio-reactive soundtrack. **Live:** https://devialet-site.vercel.app · **Repo:** Mudit01100001/devialet-phantom.

> Unaffiliated **concept / portfolio** piece (target: land 3D-web work with Grapes Worldwide). *Phantom* and *Devialet* are trademarks of Devialet; nothing here is official or for sale. The **entire 3D model was built from scratch in Blender by Mudit.**

## Read first — every UI task
1. **`next/dist/docs/`** before writing any Next.js code — this is **Next.js 16**; APIs differ from training data.
2. **`PRODUCT.md`** (brief, off-limits list) and **`DESIGN.md`** (design system, tokens) before touching any UI.

## Design rules — **Never**
- `font-mono` for UI labels — use `font-sans` (system-ui) with tracking
- `rounded-full` or any border-radius on buttons or cards (the chrome ring is the only curve)
- Gradient backgrounds or gradient text (`radial-gradient` / `linear-gradient` on surfaces)
- `text-neutral-*` hard-coded grays — use design tokens (`--color-white-muted`, `--color-white-ghost`, `--color-chrome`, …)
- Glassmorphism, backdrop-blur as decoration, glow overlays
- Purple, blue, or gold as accent colors (chrome is the single accent; gold is a finish, not a UI color)
- Card carousels or three-equal-feature-card layouts
- Decorative lights/glows on the page layer — the 3D model handles all atmospheric depth

## Stack
Next.js **16.2.9** (App Router, Turbopack) · React **19.2.4** · three **r0.184** · @react-three/fiber **9** · @react-three/drei **10** · @react-three/postprocessing **3** (postprocessing **6.39.1**) · GSAP ScrollTrigger **3.15** · Lenis **1.3** · Tailwind **4** · TypeScript **5**.

## Run & verify
```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npx tsc --noEmit # typecheck (run before committing)
```
- ⚠️ **Dev gotcha:** editing `Experience.tsx` leaves GSAP/Lenis in a stale HMR state and the scroll scrub silently freezes — **hard-reload** the preview after edits.
- The headless preview throttles `requestAnimationFrame` (scroll/camera/audio won't animate there) and reload can collapse the viewport — verify scroll/audio behavior in a real browser; `preview_resize` to restore the viewport.
- The dev audio tuner (`AudioTuner`) renders only on `localhost` (`NODE_ENV !== 'production'`); audio is **desktop-only** (gated on width + `pointer: fine`).

## Architecture — where things live
- **`components/Experience.tsx`** — the whole take. Scene, camera rig, the GSAP ScrollTrigger timeline, deterministic text reveal (`updateText(progress)`), the audio system + dev tuner, the HUD mount, cart drawer, entry gate, closing footer, and all 7 beat blocks. Render-cheap **module globals** (`view`, `PROGRESS`, `AUDIO`, `MOBILE`) are read every frame to avoid React re-renders during scroll.
- **`components/Hud.tsx`** — fixed top chrome: brand wordmark, scroll-progress bar (updated imperatively via ref), cart button.
- **`components/SceneGuard.tsx`** — WebGL feature-detection, DOM + R3F error boundaries, on-brand fallback poster.
- **`app/layout.tsx`** — metadata (title `PHANTOM`, Open Graph + Twitter cards, `metadataBase`), Italiana font, `suppressHydrationWarning`, theme color.
- **`app/globals.css`** — design tokens (`@theme`), `:focus-visible` rings, scroll-cue + eq-bar keyframes, volume-slider styling, reduced-motion block.
- **`app/icon.svg` / `icon.png` / `favicon.ico`** — P-monogram favicons.
- **`app/opengraph-image.png` / `twitter-image.png`** — social cards.
- **`public/`** — `finish_gold.glb` / `finish_rosegold.glb` / `finish_black.glb` (~1.95 MB each) + `phantom-track.m4a` (full) / `phantom-track-loop.m4a` (lighter loop).

## Key systems (all in `Experience.tsx`)
- **7-beat scroll take:** hero → shape → power → detail → spine → finish → acquire, then a closing footer. Camera driven by ScrollTrigger over a Lenis smooth-scroll spacer; copy reveal is a pure function of scroll (Z-depth + blur outside a sharp read plateau).
- **Finishes:** Gold / Rose Gold / Matte Black — all three GLBs stay mounted, visibility-toggled (swapping one `<primitive>` raced and blanked the canvas). Picker in the finish beat + acquire panel; finish-aware lighting so matte black neither blows out nor goes dead.
- **Audio (desktop only):** entry gate unlocks Web Audio on click; an `AnalyserNode` drives the woofers off DC-removed band energy (gain = symmetric swing around a fixed rest; `outLimit`/`inLimit` cap travel; `lowHz`/`highHz` band). Mute + hover-reveal volume (gain node after the analyser). Device-tiered track via `hardwareConcurrency`. Baked defaults: gain 1.05, out 0.27, in 0.05, 60–1200 Hz, vol 0.6.
- **Interaction:** site-wide drag-to-rotate (X+Y tumble that springs back; finish/acquire = seated Y-only turntable).
- **Resilience & a11y:** WebGL context-loss recovery + fallback poster; `prefers-reduced-motion` path; keyboard beat-nav (↑/↓, PageUp/Down, Home/End, Space); cart focus-trap + Esc + `inert`; global `:focus-visible` chrome rings; ≥44 px tap targets.

## Conventions
- **Per-frame state is mutated on module globals, not React state** — keep it that way; prop/state cascades during scroll cause jank.
- **GLB pipeline:** Mudit exports uncompressed GLBs from Blender; compress each with `npx @gltf-transform/cli` (WebP textures → meshopt, ≈1.95 MB) into `public/`. The finish picker loads by filename (`FINISH_URL`), so swapping a finish is a drop-in (no code change). Never headless-write his `.blend`.
- Tailwind for layout utilities; colors via tokens. White/black opacity utilities (`bg-white/10`, `text-white/90`) are acceptable infra.

## Current state (17 Jun 2026)
**Shipped & live**, `/impeccable audit` ≈ **17/20** (anti-patterns 4/4 — no AI tells). Accessibility, resilience, cross-browser, the audio system, brand/SEO, and the README are all done. **Perf micro-optimization was deliberately declined** — it serves low-end/3G users, not the agency audience; don't re-suggest it.

### 🎯 The one open task
Swap in Mudit's **new Rose Gold** and **Matte Black (lifted side panel — the current one reads too dark)** exports: compress each into `public/finish_rosegold.glb` / `public/finish_black.glb`, verify in-browser, commit. No code change.

## More context
- **`README.md`** — public project overview (renders on the repo page).
- **`../CLAUDE.md`** (parent) — full strategy, history, and the cross-project portfolio plan. This file is the in-repo working doc; that one is the program tracker.
