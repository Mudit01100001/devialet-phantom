'use client'

// Flat content sections that scroll up after the camera film finishes. Each is a
// sibling of `main` (see Experience.tsx). They never touch the GSAP/ScrollTrigger
// timeline, so the scroll take is unaffected; living in their own file also keeps
// edits here from disturbing Experience.tsx's GSAP/Lenis HMR state.
//
// Order below the take (the acquire reveal between FindYourSound and Assurances
// lives in Experience.tsx because it needs the cart/finish state + the camera):
//   editorial (dark)        : Sound → Presence
//   retail interlude (LIGHT) : Connectivity → FindYourSound
//   [acquire reveal]
//   close                   : Assurances (dark) → Professionals → Newsletter → SiteFooter
//
// Conventions: no em dashes in copy; box/card/image corners use the universal
// `--radius` token (tuned live by the dev RadiusTuner). Concept links do nothing
// (rendered as plain buttons) so they never throw you around the page.

import { useState, useEffect, useRef } from 'react'

const display = '[font-family:var(--font-italiana)]'

// A concept link: looks like a link, goes nowhere (this is a non-shippable concept).
function GhostLink({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <button type="button" className={`cursor-pointer ${className}`}>
      {children}
    </button>
  )
}

// ── SOUND ─────────────────────────────────────────────────────────────────
// Crisp editorial beat. Image gets the wider column; both editorial photos share a
// 3:2 ratio and the same grid so their columns line up section to section.
export function Sound() {
  return (
    <section className="relative z-20 bg-void px-6 py-14 md:px-[8vw] md:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[0.9fr_1.1fr] md:gap-12">
        <div>
          <p className="text-[10px] uppercase tracking-[0.42em] text-white-ghost">Sound</p>
          <h2 className={`${display} mt-4 text-balance text-4xl uppercase leading-[1.02] text-white md:text-6xl`}>
            You feel it first.
          </h2>
          <p className="mt-4 text-base font-light italic leading-relaxed text-white-muted md:text-lg">
            The price is in the silence around the note.
          </p>
          <p className="mt-5 max-w-md text-[15px] font-light leading-relaxed text-white-muted md:text-base">
            Two opposed woofers fire into a sealed chamber. ADH® hybrid amplification holds analog
            warmth under digital control, down to 14 Hz, from a body that flexes nothing of its own.
            You paid for what you don&apos;t hear: no port noise, no cabinet ring, no fan.
          </p>
        </div>
        <img
          src="/post/sound-macro.jpeg"
          alt="Macro detail of the Phantom's chrome woofer ring against its brushed body."
          className="aspect-[3/2] w-full rounded-[var(--radius)] object-cover"
        />
      </div>
    </section>
  )
}

// ── PRESENCE ──────────────────────────────────────────────────────────────
export function Presence() {
  return (
    <section className="relative z-20 bg-void px-6 py-14 md:px-[8vw] md:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[1.1fr_0.9fr] md:gap-12">
        <img
          src="/post/presence-lifestyle.jpeg"
          alt="The Phantom at home, filling a room from a single point."
          className="order-last aspect-[3/2] w-full rounded-[var(--radius)] object-cover md:order-first"
        />
        <div>
          <p className="text-[10px] uppercase tracking-[0.42em] text-white-ghost">Presence</p>
          <h2 className={`${display} mt-4 text-balance text-4xl uppercase leading-[1.02] text-white md:text-6xl`}>
            No seat is the best seat.
          </h2>
          <p className="mt-4 text-base font-light italic leading-relaxed text-white-muted md:text-lg">
            One source. Sound from everywhere, owed to nowhere.
          </p>
          <p className="mt-5 max-w-md text-[15px] font-light leading-relaxed text-white-muted md:text-base">
            A single point source fills a room with no sweet spot. Stand, sit, cross to the window;
            the field follows you. Give it a hand&apos;s width off the wall and a couple of metres of
            air. Then forget it&apos;s there.
          </p>
        </div>
      </div>
    </section>
  )
}

// ── Icons ────────────────────────────────────────────────────────────────────
// Recognizable connectivity glyphs where one exists, abstract line marks otherwise.
// Hand-authored inline (no icon library). Third-party trademarks shown in an
// unaffiliated concept (footer disclaimer).
function Glyph({ name, className = 'h-7 w-7' }: { name: string; className?: string }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  switch (name) {
    case 'airplay':
      return (
        <svg {...common}>
          <path d="M6 17H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-2" />
          <path d="M12 15l5 6H7z" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'googlecast':
      return (
        <svg {...common}>
          <path d="M3 6.2V5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-7.2" />
          <path d="M3 16.5a4.5 4.5 0 0 1 4.5 4.5" />
          <path d="M3 12.7a8.3 8.3 0 0 1 8.3 8.3" />
          <circle cx="3.6" cy="20.4" r="0.7" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'spotify':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M7.3 9.4c3.1-1 6.7-.7 9.3 1" />
          <path d="M7.9 12.7c2.5-.8 5.4-.5 7.5 1" />
          <path d="M8.5 15.8c1.9-.6 4-.4 5.7.8" />
        </svg>
      )
    case 'bluetooth':
      return (
        <svg {...common}>
          <path d="M6.5 7.5 17.5 16.5 12 21 12 3 17.5 7.5 6.5 16.5" />
        </svg>
      )
    case 'waveform':
      return (
        <svg {...common}>
          <path d="M4 9v6M8.5 5v14M13 8v8M17.5 6v12M21 10v4" />
        </svg>
      )
    case 'network':
      return (
        <svg {...common}>
          <circle cx="12" cy="5" r="2" />
          <circle cx="5" cy="18" r="2" />
          <circle cx="19" cy="18" r="2" />
          <path d="M12 7v3.5M11 11 6.2 16M13 11l4.8 5" />
        </svg>
      )
    case 'wave':
      return (
        <svg {...common}>
          <path d="M3 12c2-4.5 4-4.5 6 0s4 4.5 6 0 4-4.5 6 0" />
        </svg>
      )
    default:
      return null
  }
}

// ── CONNECTIVITY ────────────────────────────────────────────────────────────
// LIGHT selectable bento (reference style): a row of white boxes, icon atop + name
// at the bottom; click one to select it (dark outline) and its explanation updates
// below the row. Slightly rounded via --radius.
const SOURCES: { name: string; glyph: string; blurb: string; detail: string }[] = [
  { name: 'AirPlay 2', glyph: 'airplay', blurb: 'lossless, multi-room', detail: 'Stream lossless from any Apple device, in sync across every room.' },
  { name: 'Google Cast', glyph: 'googlecast', blurb: 'any app, anywhere', detail: 'Send audio from any Cast-enabled app to Phantom, anywhere in the house.' },
  { name: 'Spotify Connect', glyph: 'spotify', blurb: 'supports lossless', detail: 'Stream your playlists straight to Phantom at full quality. Your phone stays free.' },
  { name: 'Roon Ready', glyph: 'waveform', blurb: 'bit-perfect', detail: 'Roon-certified for bit-perfect routing and whole-home grouping.' },
  { name: 'UPnP', glyph: 'network', blurb: 'your library, served', detail: 'Browse and play your networked library over UPnP, with no extra app.' },
  { name: 'Tidal Connect', glyph: 'wave', blurb: 'master quality', detail: 'Master-quality streams handed straight to Phantom, untouched on the way in.' },
  { name: 'Bluetooth 5.3', glyph: 'bluetooth', blurb: 'fast and stable', detail: 'Fast, low-latency wireless for everything else, with longer range.' },
]

export function Connectivity() {
  const [sel, setSel] = useState(0)
  const active = SOURCES[sel]
  return (
    <section className="relative z-20 bg-paper px-6 py-20 text-ink md:px-[8vw] md:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="text-[10px] uppercase tracking-[0.42em] text-ink-ghost">Connectivity</p>
        <h2 className={`${display} mt-4 text-balance text-4xl uppercase leading-[1.05] md:text-5xl`}>
          Plays from anything.
        </h2>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {SOURCES.map((s, i) => (
            <button
              key={s.name}
              type="button"
              onClick={() => setSel(i)}
              aria-pressed={sel === i}
              className={`flex flex-col items-center justify-center gap-4 rounded-[var(--radius)] border bg-white px-3 py-7 text-center transition-colors ${
                sel === i ? 'border-ink' : 'border-black/10 hover:border-black/30'
              }`}
            >
              <span className="flex h-7 items-center justify-center text-ink">
                <Glyph name={s.glyph} />
              </span>
              <span className="text-[10px] uppercase leading-tight tracking-[0.14em] text-ink">{s.name}</span>
            </button>
          ))}
        </div>

        {/* explanation for the selected source */}
        <div className="mt-12 text-center">
          <p className="text-sm font-medium tracking-wide text-ink">
            {active.name} · {active.blurb}
          </p>
          <p className="mx-auto mt-2 max-w-xl text-[13px] font-light leading-relaxed text-ink-muted">
            {active.detail}
          </p>
        </div>
      </div>
    </section>
  )
}

// ── FIND YOUR SOUND ─────────────────────────────────────────────────────────
// Signature reference bento: a product hero over a LIGHT editorial card (now with
// its own small image) and an INVERTED dark card. CTAs are inert (concept).
export function FindYourSound() {
  return (
    <section className="relative z-20 bg-paper px-6 pb-24 pt-6 text-ink md:px-[8vw] md:pb-28 md:pt-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-[10px] uppercase tracking-[0.42em] text-ink-ghost">The Range</p>
        <h2 className={`${display} mt-4 text-balance text-4xl uppercase leading-[1.05] md:text-6xl`}>
          Alive with sound.
        </h2>

        <div className="mt-10 grid gap-4 md:gap-5">
          <img
            src="/post/range-hero.jpeg"
            alt="The Phantom range shown together."
            className="aspect-[16/9] w-full rounded-[var(--radius)] object-cover md:aspect-[21/9]"
          />

          <div className="grid gap-4 md:grid-cols-2 md:gap-5">
            {/* light editorial card, now with a small image */}
            <div className="flex flex-col rounded-[var(--radius)] bg-paper-deep p-7 md:p-9">
              <img
                src="/post/heritage.jpeg"
                alt="The original Phantom form beside its refined successor."
                className="aspect-[16/9] w-full rounded-[var(--radius)] object-cover"
              />
              <h3 className="mt-6 text-lg font-normal tracking-wide text-ink">
                The evolution of the revolution.
              </h3>
              <p className="mt-3 max-w-md text-[13px] font-light leading-relaxed text-ink-muted">
                The first Phantom broke what a speaker was allowed to look like. This is that form,
                pressurised and quieted, taken to its end.
              </p>
              <GhostLink className="mt-6 inline-flex items-center gap-2 self-start text-[11px] uppercase tracking-[0.2em] text-ink transition-opacity hover:opacity-60">
                Discover the story <span aria-hidden>→</span>
              </GhostLink>
            </div>

            {/* inverted dark card */}
            <div className="flex flex-col justify-between rounded-[var(--radius)] bg-void p-7 text-white md:p-9">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white-ghost">Find your sound</p>
                <h3 className={`${display} mt-5 text-3xl uppercase leading-[1.05] md:text-4xl`}>
                  Select your model.
                </h3>
                <p className="mt-4 max-w-xs text-[13px] font-light leading-relaxed text-white-muted">
                  Compare the range and the room each one is built for. Find the one made for yours.
                </p>
              </div>
              <GhostLink className="mt-8 inline-flex min-h-[44px] items-center gap-2 self-start rounded-[var(--radius)] border border-white/25 px-6 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:border-white">
                Compare our speakers <span aria-hidden>→</span>
              </GhostLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Line icons (assurances) ─────────────────────────────────────────────────
function LineIcon({ name, className = 'h-6 w-6' }: { name: string; className?: string }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  switch (name) {
    case 'delivery':
      return (
        <svg {...common}>
          <path d="M3 7.5 12 3l9 4.5v9L12 21 3 16.5z" />
          <path d="M3 7.5 12 12l9-4.5M12 12v9" />
        </svg>
      )
    case 'returns':
      return (
        <svg {...common}>
          <path d="M4 9a8 8 0 1 1-1.2 5.5" />
          <path d="M3 4v5h5" />
        </svg>
      )
    case 'secure':
      return (
        <svg {...common}>
          <rect x="5" y="10.5" width="14" height="9.5" />
          <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
          <circle cx="12" cy="15" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'warranty':
      return (
        <svg {...common}>
          <path d="M12 3 5 6v5c0 4.4 3 8 7 10 4-2 7-5.6 7-10V6z" />
          <path d="M9 12l2 2 4-4.5" />
        </svg>
      )
    default:
      return null
  }
}

// ── ASSURANCES ──────────────────────────────────────────────────────────────
// Trust row, now DARK (black section, grey tiles) and placed BELOW the order/acquire
// section. Bento of surface-raised tiles, icon over label + note.
const ASSURANCES = [
  { icon: 'delivery', label: 'Free delivery', note: 'Insured, to your door' },
  { icon: 'returns', label: '14-day returns', note: 'Change your mind?' },
  { icon: 'secure', label: 'Secure checkout', note: 'Encrypted payment' },
  { icon: 'warranty', label: '2-year warranty', note: 'Parts and labour' },
]

export function Assurances() {
  return (
    <section className="relative z-20 bg-void px-6 py-16 md:px-[8vw] md:py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {ASSURANCES.map((a) => (
          <div
            key={a.label}
            className="flex flex-col items-start gap-3 rounded-[var(--radius)] bg-surface-raised p-6 md:p-7"
          >
            <span className="text-white-muted">
              <LineIcon name={a.icon} />
            </span>
            <span className="text-[11px] uppercase tracking-[0.22em] text-white">{a.label}</span>
            <span className="text-[11px] font-light tracking-[0.06em] text-white-ghost">{a.note}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── PROFESSIONALS ───────────────────────────────────────────────────────────
// White bento on black: a big paper card (the headline) beside a paper-deep advisor
// card. "For professionals" leads; the room line is the sub. CTAs inert.
export function Professionals() {
  return (
    <section className="relative z-20 bg-void px-6 pb-16 md:px-[8vw] md:pb-20">
      <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3 md:gap-5">
        {/* headline card */}
        <div className="flex min-h-[17rem] flex-col justify-between rounded-[var(--radius)] bg-paper p-9 text-ink md:col-span-2 md:p-12">
          <div>
            <p className="text-[10px] uppercase tracking-[0.42em] text-ink-ghost">Pro &amp; install</p>
            <h2 className={`${display} mt-5 text-4xl uppercase leading-[1.02] md:text-6xl`}>
              For professionals.
            </h2>
            <p className="mt-4 text-base font-light tracking-wide text-ink-muted md:text-lg">
              Specified for your room.
            </p>
          </div>
          <p className="mt-8 max-w-md text-[13px] font-light leading-relaxed text-ink-muted">
            Studios, listening rooms, fixed install. Tuned to the space, not the shelf.
          </p>
          <GhostLink className="mt-6 inline-flex items-center gap-2 self-start text-[11px] uppercase tracking-[0.2em] text-ink transition-opacity hover:opacity-60">
            It&apos;s right here <span aria-hidden>→</span>
          </GhostLink>
        </div>

        {/* advisor card */}
        <div className="flex flex-col justify-between rounded-[var(--radius)] bg-paper-deep p-9 text-ink md:p-10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-ink-ghost">Advisors</p>
            <h3 className="mt-4 text-lg font-normal tracking-wide text-ink">Talk to a specialist.</h3>
            <p className="mt-3 text-[13px] font-light leading-relaxed text-ink-muted">
              One on one, before you commit. Mon to Fri, 9 to 18 CET.
            </p>
          </div>
          <GhostLink className="mt-8 inline-flex min-h-[44px] items-center gap-2 self-start rounded-[var(--radius)] border border-ink/20 px-6 text-[11px] uppercase tracking-[0.2em] text-ink transition-colors hover:border-ink">
            Start a chat <span aria-hidden>→</span>
          </GhostLink>
        </div>
      </div>
    </section>
  )
}

// ── NEWSLETTER ────────────────────────────────────────────────────────────
// "Join the revolution" over a night-sky/moon image (Mudit's render goes in the
// outer rectangle in a lighter tone), with a smaller white card carrying the form.
// Below it, a contact strip with hours and a lighter "Chat with us". Decorative:
// validates client-side and shows a thank-you state (no backend).
export function Newsletter() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState(false)
  // Format check only (no backend, nothing stored) — enough to reject random text.
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) {
      setError(true)
      return
    }
    setError(false)
    setDone(true)
  }
  return (
    <section className="relative z-20 bg-void px-6 pb-16 md:px-[8vw] md:pb-20">
      <div className="mx-auto max-w-6xl">
        {/* outer rectangle — moon image slot (lighter tone) */}
        <div className="relative flex min-h-[24rem] items-center justify-center overflow-hidden rounded-[var(--radius)] bg-surface-raised px-6 py-10 md:px-14 md:py-16">
          <img
            src="/post/newsletter-moon.png"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* inner white card — centred, two columns (copy left / form right) */}
          <div className="relative z-10 mx-auto w-full max-w-4xl rounded-[var(--radius)] bg-white p-8 text-ink md:p-12">
            <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-14">
              {/* left — heading + copy */}
              <div>
                <h2 className={`${display} text-3xl uppercase leading-[1.05] md:text-4xl`}>
                  Join the revolution
                </h2>
                <p className="mt-3 text-[13px] font-light leading-relaxed text-ink-muted">
                  Sign up for live updates on Devialet. All over the world.
                </p>
                <p className="mt-6 text-[10px] font-light leading-relaxed text-ink-ghost">
                  Devialet will only use the information you provide for the limited purposes set out
                  in our Privacy Policy.
                </p>
              </div>

              {/* right — form */}
              <div>
                {done ? (
                  <p className="text-sm font-light text-ink">You&apos;re on the list. Listen out.</p>
                ) : (
                  <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (error) setError(false)
                      }}
                      placeholder="Email"
                      aria-label="Email address"
                      aria-invalid={error}
                      aria-describedby={error ? 'newsletter-error' : undefined}
                      className={`w-full rounded-[var(--radius)] border bg-white px-4 py-3 text-sm font-light text-ink placeholder:text-ink-ghost focus:outline-none ${
                        error ? 'border-red-500 focus:border-red-500' : 'border-black/15 focus:border-ink'
                      }`}
                    />
                    {error && (
                      <p id="newsletter-error" className="text-[11px] font-light tracking-[0.04em] text-red-600">
                        Please enter a valid email address.
                      </p>
                    )}
                    <button
                      type="submit"
                      className="min-h-[44px] w-full cursor-pointer rounded-[var(--radius)] bg-ink px-7 py-3 text-[11px] uppercase tracking-[0.2em] text-paper transition-opacity hover:opacity-80"
                    >
                      Subscribe
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* contact strip */}
        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white-muted">
            Contact our advisors
            <span className="ml-3 text-white-ghost">Mon to Fri, 9am to 11.45am | 7pm to 10pm (EDT)</span>
          </p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('phantom:open-chat'))}
            className="cursor-pointer self-start text-[11px] uppercase tracking-[0.2em] text-white-ghost transition-colors hover:text-white-muted md:self-auto"
          >
            Chat with us
          </button>
        </div>
      </div>
    </section>
  )
}

// ── SITE FOOTER ───────────────────────────────────────────────────────────
// The back-to-top / concept strip is OFF-WHITE (paper) so the very bottom comes to
// life instead of reading as neglected dark. Below it, dark nav columns + credits.
// All links are inert (concept).
const FOOTER_COLS: { heading: string; links: string[] }[] = [
  { heading: 'Phantom', links: ['Overview', 'Specifications', 'Finishes', 'Connectivity'] },
  { heading: 'Company', links: ['Story', 'Craft', 'Press'] },
  { heading: 'Owners', links: ['Support', 'Warranty', 'Register'] },
  { heading: 'Connect', links: ['Contact', 'Newsletter', 'Instagram', 'Facebook', 'X'] },
]

export function SiteFooter({
  onBackToTop,
  audioOn,
  musicCredit,
}: {
  onBackToTop: () => void
  audioOn: boolean
  musicCredit: string
}) {
  return (
    <footer className="relative z-20 bg-void">
      {/* off-white back-to-top strip */}
      <div className="flex items-center justify-between bg-paper px-6 py-7 text-ink md:px-[8vw]">
        <span className="text-[10px] uppercase tracking-[0.42em] text-ink-ghost">Devialet · Concept</span>
        <button
          onClick={onBackToTop}
          aria-label="Back to top"
          className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-ink-muted transition-colors hover:text-ink"
        >
          Back to top <span aria-hidden>↑</span>
        </button>
      </div>

      {/* nav columns */}
      <div className="border-t border-white/10 px-6 py-16 md:px-[8vw]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
          {FOOTER_COLS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-[11px] uppercase tracking-[0.24em] text-white">{col.heading}</h3>
              <ul className="mt-5 flex flex-col gap-3.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <GhostLink className="text-left text-[13px] font-light tracking-[0.04em] text-white-muted transition-colors hover:text-white">
                      {link}
                    </GhostLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* legal / credits bar */}
      <div className="border-t border-white/10 px-6 py-10 md:px-[8vw]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 text-center">
          <p className="text-[10px] uppercase tracking-[0.28em] text-white-muted">
            The entire 3D model, built from scratch in Blender by Mudit
          </p>
          <p className="text-[10px] uppercase tracking-[0.24em] text-white-ghost">
            Real-time site in React Three Fiber + GSAP
          </p>
          {audioOn && (
            <p className="text-[10px] uppercase tracking-[0.24em] text-white-ghost">Music · {musicCredit}</p>
          )}
          <p className="mt-3 text-[10px] tracking-[0.08em] text-white-ghost">
            © 2026 · Phantom and Devialet are trademarks of Devialet. An unaffiliated design concept.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ── CHAT (concept) ───────────────────────────────────────────────────────────
// Mock concierge popup, bottom-right. There is NO persistent launcher — it only
// appears when a "Chat with us" trigger fires the 'phantom:open-chat' window event,
// so it never competes with the hero. Any message gets the same canned reply (the
// sales rep is on vacation). Nothing is sent or stored — messages live in local
// state and vanish on reload.
type ChatMsg = { from: 'bot' | 'you'; text: string }
const CHAT_REPLY = 'Our sales reps are on vacation right now. Please come back later 😁'

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { from: 'bot', text: 'Hi, you have reached Devialet. How can we help?' },
  ])
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const openIt = () => setOpen(true)
    window.addEventListener('phantom:open-chat', openIt)
    return () => window.removeEventListener('phantom:open-chat', openIt)
  }, [])

  // Keep the newest message in view.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [msgs, open])

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    setText('')
    setMsgs((m) => [...m, { from: 'you', text: t }])
    // Canned reply after a short beat so it reads like a response. Stores nothing.
    window.setTimeout(() => setMsgs((m) => [...m, { from: 'bot', text: CHAT_REPLY }]), 650)
  }

  // No persistent launcher: render nothing until a trigger opens it.
  if (!open) return null

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex justify-end">
      <div className="pointer-events-auto flex h-[26rem] w-[min(20rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-[var(--radius)] border border-white/12 bg-surface-raised text-white shadow-[0_16px_50px_-12px_rgba(0,0,0,0.7)]">
          {/* header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white">
              <span className="h-1.5 w-1.5 bg-white/70" aria-hidden /> Devialet · Concierge
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="cursor-pointer text-white-ghost transition-colors hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M2 2l10 10M12 2L2 12" />
              </svg>
            </button>
          </div>
          {/* messages */}
          <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
            {msgs.map((m, i) => (
              <div key={i} className={m.from === 'you' ? 'flex justify-end' : 'flex justify-start'}>
                <span
                  className={`max-w-[80%] rounded-[var(--radius)] px-3 py-2 text-[12.5px] font-light leading-relaxed ${
                    m.from === 'you' ? 'bg-white text-ink' : 'bg-white/[0.08] text-white-muted'
                  }`}
                >
                  {m.text}
                </span>
              </div>
            ))}
          </div>
          {/* input */}
          <form onSubmit={send} className="flex items-center gap-2 border-t border-white/10 p-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a message"
              aria-label="Message"
              className="min-w-0 flex-1 rounded-[var(--radius)] border border-white/15 bg-transparent px-3 py-2 text-[12.5px] font-light text-white placeholder:text-white-ghost focus:border-white/40 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Send message"
              className="flex min-h-[40px] min-w-[40px] cursor-pointer items-center justify-center rounded-[var(--radius)] bg-white text-ink transition-opacity hover:opacity-80"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>
        </div>
    </div>
  )
}
