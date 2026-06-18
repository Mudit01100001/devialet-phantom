'use client'

import { forwardRef, useImperativeHandle, useRef } from 'react'

export type HudHandle = { setHidden: (hidden: boolean) => void }

// Persistent top nav. Brand left, category links centre, cart right. It auto-hides
// on scroll-down and returns on scroll-up (driven imperatively from the Lenis scroll
// handler in Experience.tsx via setHidden → no React re-render). `overLight` flips
// the chrome to dark ink so it stays legible over the paper retail interlude.
const NAV = ['Speakers', 'Soundbar', 'Earbuds', 'Amplifiers', 'About']

const Hud = forwardRef<
  HudHandle,
  {
    onSeek: (progress: number) => void
    cartCount?: number
    onOpenCart?: () => void
    overLight?: boolean
  }
>(function Hud({ onSeek, cartCount = 0, onOpenCart, overLight = false }, ref) {
  const headerRef = useRef<HTMLElement>(null)

  useImperativeHandle(ref, () => ({
    setHidden(hidden: boolean) {
      const el = headerRef.current
      if (el) el.style.transform = hidden ? 'translateY(-110%)' : 'translateY(0)'
    },
  }))

  const link = `text-[11px] uppercase tracking-[0.2em] transition-colors duration-300 ${
    overLight ? 'text-ink-muted hover:text-ink' : 'text-white-muted hover:text-white'
  }`

  return (
    <header
      ref={headerRef}
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-6 pl-[max(1.75rem,env(safe-area-inset-left))] pr-[max(1.75rem,env(safe-area-inset-right))] pt-[max(1.4rem,env(safe-area-inset-top))] pb-5 transition-transform duration-500 ease-out will-change-transform"
    >
      {/* brand */}
      <button
        onClick={() => onSeek(0)}
        aria-label="Return to top"
        className={`pointer-events-auto shrink-0 text-sm font-medium tracking-[0.34em] transition-colors duration-500 ${
          overLight ? 'text-ink' : 'text-white'
        }`}
      >
        PHANTOM
      </button>

      {/* category links — inert (concept site; navigating nowhere is better than
          jumping you around the same page). Hidden on small screens. */}
      <nav className="pointer-events-auto absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
        {NAV.map((n) => (
          <button key={n} type="button" className={link}>
            {n}
          </button>
        ))}
      </nav>

      {/* cart */}
      <button
        onClick={onOpenCart}
        aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
        className={`pointer-events-auto flex min-h-[44px] shrink-0 items-center gap-2 tracking-[0.22em] ${link}`}
      >
        Cart
        <span
          className={`inline-flex h-5 min-w-5 items-center justify-center border px-1 text-[10px] tracking-normal transition-colors duration-500 ${
            overLight ? 'border-ink/20 text-ink' : 'border-white/20 text-white'
          }`}
          data-empty={cartCount === 0}
        >
          {cartCount}
        </span>
      </button>
    </header>
  )
})

export default Hud
