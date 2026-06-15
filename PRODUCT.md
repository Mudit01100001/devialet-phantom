# Devialet Phantom — Product Brief

## What this is
A mock-brand portfolio site for the Devialet Phantom speaker. The brand does not exist in this form; the site exists to showcase end-to-end 3D web + brand + marketing craft at Awwwards level.

**Primary goal:** Land premium production work with Grapes Worldwide (Indian creative agency). Demonstrate that 3D marketing sites can be built at agency quality, at AI speed.

## The product
Devialet Phantom — a $2,000–$6,000 premium wireless speaker. The object is alien-looking: a white sphere flanked by a chrome woofer ring that pulsates when playing audio. It is simultaneously a precision engineering artifact and a luxury object. It belongs in a gallery more than a living room.

## The audience
Design-conscious creative directors and agency heads. The person reviewing this site evaluates creative work for a living. They will immediately clock "AI default" aesthetics and dismiss the work. They are judging whether this could stand next to Lusion × Mercedes EQS, the Sonos site, or Bang & Olufsen's online experience.

## The bar
Awwwards Site of the Day. The reference is Lusion × Mercedes EQS — one continuous camera take, scroll-driven 3D, cinematic lighting, no moment where it feels like "a website."

## What the site does
7 scroll beats, all driven by GSAP ScrollTrigger + Lenis smooth scroll. The camera orbits, tilts, and pushes through the speaker model. Each beat has a name and a purpose:

1. **HERO** — "PHANTOM" wordmark behind the canvas. Speaker emerges from black. Cursor parallax on the wordmark. Animated scroll nudge.
2. **THE SOUND** — Camera tilts to reveal the tweeter face. Woofer pulse begins.
3. **THE ARCHITECTURE** — Camera circles to reveal the woofer side. Chrome ring in full frame.
4. **THE SPINE** — Camera drifts to rear fins. Engineering language. Detail copy.
5. **CRAFTSMANSHIP** — Close push on the chrome ring. Lightformer reflections at maximum intensity.
6. **FINISH** — Finish picker (Ivory & Gold / Rose Gold / Matte Black). Drag-to-rotate. Stand visible here only.
7. **ACQUIRE** — CTA section. Price. Ghost button.

## What "winning" looks like
- Visiting the site feels like watching a product film, not browsing a webpage
- The 3D model is the dominant presence at every scroll position
- Type and UI feel like they belong to the same art direction as the model
- No moment that reads as "AI default"

## Explicit off-limits
- Glassmorphism
- Gradient text or gradient backgrounds (the Bloom glow on the 3D model is the only gradient on the page)
- Card carousels
- Blue or purple as accents
- Gold used as a UI color (Gold is a finish option, not an accent color)
- Pill-shaped buttons
- Rounded cards
- Any pattern from the standard "dark SaaS landing page" template

## Stack
Next.js + React Three Fiber + GSAP ScrollTrigger + Lenis. TypeScript. Tailwind for layout utilities only.

## Design language (summary)
Apple restraint + Lamborghini darkness. Full detail in DESIGN.md.
- True black canvas
- Italiana serif for all display type (40px+), ALL-CAPS, weight 400, tight line-height
- System-ui for UI copy, weight 300, wide tracked labels
- Chrome as the single accent color (echoes the physical woofer ring)
- Zero border-radius on buttons
- Ghost buttons only (no filled CTAs)
- Surface layering for depth, never box-shadow
- UI recedes; the 3D model speaks
