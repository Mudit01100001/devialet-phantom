<div align="center">

# PHANTOM

### A scroll-driven 3D product film for the Devialet Phantom — built for the web.

**[▶ Live demo →](https://devialet-site.vercel.app)**

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232a?logo=react&logoColor=61dafb)
![Three.js](https://img.shields.io/badge/Three.js-r184-000000?logo=threedotjs&logoColor=white)
![React Three Fiber](https://img.shields.io/badge/React_Three_Fiber-9-black)
![GSAP](https://img.shields.io/badge/GSAP_ScrollTrigger-3-88ce02?logo=greensock&logoColor=white)
![Lenis](https://img.shields.io/badge/Lenis-smooth_scroll-111)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)

</div>

> **Concept piece.** This is an unaffiliated design concept and portfolio demonstration. *Phantom* and *Devialet* are trademarks of Devialet; nothing here is an official product or for sale.

> **The entire 3D model is original work.** Every part of the Phantom was modelled from scratch in Blender by **Mudit** — no purchased, scanned, or downloaded assets — then meshopt-compressed for real-time WebGL.

---

## What it is

A single, continuous **scroll-scrubbed camera take** around a real-time 3D model of the Devialet Phantom speaker — hand-modelled from scratch in Blender, exported to a compressed `.glb`, and rendered in the browser with React Three Fiber. The whole page reads like one cinematic product film: the camera travels, settles, and holds across six beats while the speaker reacts to a live soundtrack — then, below the film, the page becomes a full product/retail experience and the 3D speaker reappears for the buying moment.

The goal was **Awwwards-ceiling craft** — a clean, minimal, "the product *is* the page" experience — taken end to end: modelling, compression, real-time rendering, post-processing grade, scroll choreography, audio reactivity, accessibility, and cross-browser resilience.

## The experience — six beats, one take

| # | Beat | What happens |
|---|------|--------------|
| 1 | **Hero** | The wordmark sits behind the floating speaker; grab and tumble it. |
| 2 | **Shape** | *"No straight lines."* — the camera reveals the pressurised form. |
| 3 | **Power** | *"108 dB."* — the woofers thump hardest here. |
| 4 | **Detail** | *"Engineered to the millimetre."* — close on the tweeter. |
| 5 | **Spine** | *"Heat, silenced."* — the machined rear fins. |
| 6 | **Finish** | Choose Gold / Rose Gold / Matte Black; drag the seated turntable. The film ends here. |

The camera is driven by **GSAP ScrollTrigger** over a **Lenis** smooth-scroll spacer; beat copy reveals deterministically as a pure function of scroll position (no chained tweens), travelling back in Z with a sharp "read" plateau.

## After the film — the retail body

The film ends at *pick a finish*; the rest of the page reads like a real product page, structured as a deliberate **dark → light → dark** sequence:

1. **Editorial (dark)** — *Sound* and *Presence*, two type-led beats that carry the film's voice.
2. **Light retail interlude (paper)** — the single palette flip. A **selectable connectivity bento** (a row of marks — AirPlay, Spotify, Bluetooth, Cast and the rest — where clicking one updates its explanation below the row) and *The Range*.
3. **Acquire (the 3D reappears)** — a transparent section lets the fixed canvas show through again; a second ScrollTrigger blends the camera to the buy pose while a panel slides in with price, specs, finish, and add-to-cart → a floating cart drawer.
4. **Close (dark)** — ownership assurances, a *for professionals* band, a *Join the revolution* newsletter, and the footer (an off-white back-to-top strip over dark nav columns).

A localhost-only **corner-radius dev slider** tunes one universal `--radius` token across every retail box, card, and image.

## Tech stack & versions

| Layer | Tooling | Version |
|-------|---------|---------|
| Framework | **Next.js** (App Router, Turbopack) | `16.2.9` |
| UI runtime | **React** / React DOM | `19.2.4` |
| 3D engine | **three.js** | `r0.184` |
| React renderer | **@react-three/fiber** | `9.6.1` |
| Helpers | **@react-three/drei** | `10.7.7` |
| Post-processing | **@react-three/postprocessing** / **postprocessing** | `3.0.4` / `6.39.1` |
| Scroll animation | **GSAP** ScrollTrigger | `3.15.0` |
| Smooth scroll | **Lenis** | `1.3.23` |
| Styling | **Tailwind CSS** | `4` |
| Language | **TypeScript** | `5` |

**Asset pipeline:** Blender → `.glb` exported per finish → compressed with `@gltf-transform` (WebP textures → meshopt) to **~1.95 MB each**. All three finishes stay mounted and are toggled by visibility so swapping is instant and never blanks the canvas.

**Render grade:** an `EffectComposer` stack — selective **Bloom** (threshold ≈ 1, so only chrome/gold speculars glint) → **BrightnessContrast** → **HueSaturation** → **Noise** (kills dark-gradient banding) → **Vignette** → **ToneMapping** (PBR-neutral, applied last). A Lightformer studio rig lights the scene; lighting is finish-aware so Matte Black never blows out or goes dead.

## What it does — capabilities

- **Real-time 3D, not a video** — orbiting camera, drag-to-rotate, live material swaps, all in WebGL.
- **Audio-reactive woofers** — an optional soundtrack drives the woofer cones in real time (see below).
- **Concept commerce** — finish picker, price, spec accordions, and a floating cart drawer.
- **Deterministic scroll narrative** — the camera and copy are choreographed independently against one scroll timeline.
- **Cinematic post-processing** — bloom, grade, grain, vignette, and neutral tone-mapping.
- **Accessible & resilient** — keyboard navigation, reduced-motion path, focus management, and graceful failure on unsupported browsers.

### Audio system

A signature touch for a *speaker* brand. On a desktop-width window an **entry gate** offers **"Enter with sound"** — the click unlocks Web Audio (browsers block autoplay), and the looping track plays through the whole experience. A Web Audio `AnalyserNode` reads the track each frame and drives the woofer cones:

- The cone moves as a **symmetric swing around its true rest position** (the band energy has its slow-moving DC baseline removed, so loudness controls *amplitude*, not offset — it never creeps outward or recedes into the cabinet).
- A **selectable frequency range** decides what drives it — narrow + low tracks the kick; widen it for the whole mix / the band you actually hear on laptop speakers.
- A **bottom-left mute toggle** with a **hover-reveal volume slider**; volume sits on a Web Audio gain node *after* the analyser, so the woofer reaction stays independent of listening volume.
- **Device-tiered loading** — higher-end machines stream the full ~2.3 min track; lower-powered ones get a lighter ~40 s loop (detected via `hardwareConcurrency`), so the audio download scales with the device.
- Mobile and reduced-motion visitors get the experience **silently** by default.

> A localhost-only dev tuner (swing / travel limits / frequency range) was used to dial in the shipped defaults; it never ships to production.

## Engineering log — issues found & fixed

Driven by an internal **`/impeccable` design audit** (which opened at **32/40**, with four P1s). Every gap was closed:

**Resilience & cross-browser**
- WebGL **feature-detection + context-loss recovery** + an error boundary, with an on-brand fallback poster instead of a silent black screen.
- **Safari audio gate** — stopped waiting on media preload (Safari defers it), so the gate never hangs; the track is served as `.m4a` (AAC) for universal playback.
- Suppressed a **hydration warning** caused by third-party `<html>`/`<body>` attribute injection (browser extensions, preview tooling).

**Accessibility**
- **Reduced-motion path** — drops smooth-scroll inertia, the blur/Z-fly text reveal, cursor parallax, and damps the audio-driven motion.
- **Keyboard navigation** — `↑/↓`, PageUp/Down, Home/End, Space jump beat-to-beat.
- **Cart drawer a11y** — Tab focus-trap, Escape to close, focus return, `inert` when closed.
- **WCAG-AA contrast** and **≥44 px touch targets** throughout.

**Narrative & polish**
- A **closing payoff footer** that slides up over the product (the experience used to stop dead).
- A **preloader / entry gate** replacing the cold-black first paint.
- Brand tab identity: title set to **PHANTOM** with a **P-monogram favicon** (`.svg` + `.png` + multi-size `.ico`).
- **Open Graph / Twitter cards** + `metadataBase` so shared links show a branded preview, not a blank box.

**Removed anti-patterns**
- A dead "SOUND" toggle, an AI-slop section dot-nav, and the Leva debug panel — all cut from production.

## Optimised for every viewer

| View | How it adapts |
|------|---------------|
| **Desktop** | Full camera pan (speaker travels *opposite* the incoming copy), cursor parallax on the wordmark, mouse drag-to-tumble, and the audio experience. |
| **Mobile / touch** | Camera reframes for portrait (pulls back, lifts the model into the top); copy anchors to the bottom with safe-area insets; `touch-action: pan-y` lets a horizontal swipe rotate while vertical still scrolls; audio stays silent by default. |
| **Reduced motion** | Native 1:1 scroll, copy cross-fades (no blur or fly-in), no cursor parallax, damped woofer reaction — the camera take remains because it *is* the content. |
| **No WebGL / load failure** | Feature-detected up front; a branded poster with a reload action replaces a dead canvas. |
| **Safari / Firefox** | AAC soundtrack, context-loss recovery, gesture-unlocked audio, and a gate that never waits on preload. |
| **Shared links** | Open Graph + Twitter `summary_large_image` cards with an absolute-URL image. |

## Run it locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

> The dev audio tuner only appears on `localhost`. To hear the soundtrack, open a desktop-width window and choose **Enter with sound**.

```bash
npm run build   # production build
npm run start   # serve the production build
```

## Project structure

```
app/
  layout.tsx        metadata, fonts, OG/Twitter, favicons
  page.tsx          mounts the experience
  globals.css       design tokens + Tailwind theme
  icon.svg / .png   P-monogram favicons (+ favicon.ico)
  opengraph-image.png / twitter-image.png
components/
  Experience.tsx    the whole take — scene, camera rig, scroll timeline,
                    audio system, nav mount, cart, entry gate, the 6 film
                    beats + the post-film acquire reveal (needs cart/camera)
  PostTake.tsx      post-film body — editorial (sound, presence), the light
                    retail interlude (connectivity bento, the range),
                    assurances, professionals, newsletter, footer
  Hud.tsx           hide-on-scroll top nav (brand, category links, cart)
  SceneGuard.tsx    WebGL detection, error boundaries, fallback poster
public/             compressed .glb finishes + soundtrack
```

---

<div align="center">
<sub>3D model built from scratch in Blender by Mudit · Site in React Three Fiber + GSAP · An unaffiliated design concept.</sub>
</div>
