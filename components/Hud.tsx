'use client'

import { forwardRef, useImperativeHandle, useRef } from 'react'

export type HudHandle = { update: (p: number) => void }

// Persistent top-bar chrome. The scroll-progress bar is updated imperatively from
// the ScrollTrigger onUpdate (no React re-render → never disturbs the canvas); the
// cart count comes in as a prop and re-renders only this lightweight HTML layer.
const Hud = forwardRef<
  HudHandle,
  {
    onSeek: (progress: number) => void
    onToggleSound?: () => void
    cartCount?: number
    onOpenCart?: () => void
  }
>(function Hud({ onSeek, onToggleSound, cartCount = 0, onOpenCart }, ref) {
  const barRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    update(p: number) {
      if (barRef.current) barRef.current.style.transform = `scaleX(${Math.min(1, Math.max(0, p))})`
    },
  }))

  return (
    <>
      {/* thin scroll-progress bar pinned to the very top edge */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-px bg-white/10">
        <div
          ref={barRef}
          className="h-full w-full origin-left bg-white/70"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      {/* top bar: brand left, cart right */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-start justify-between pb-6 pl-[max(1.75rem,env(safe-area-inset-left))] pr-[max(1.75rem,env(safe-area-inset-right))] pt-[max(1.5rem,env(safe-area-inset-top))]">
        <button onClick={() => onSeek(0)} aria-label="Return to top" className="pointer-events-auto text-left">
          <div className="text-sm font-medium tracking-[0.34em] text-white">PHANTOM</div>
          <div className="mt-1 text-[10px] tracking-[0.28em] text-white-ghost">DEVIALET — CONCEPT</div>
        </button>

        <button
          onClick={onOpenCart}
          aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
          className="pointer-events-auto flex min-h-[44px] items-center gap-2 pt-1 text-[11px] uppercase tracking-[0.22em] text-white-muted transition-colors duration-300 hover:text-white"
        >
          Cart
          <span
            className="inline-flex h-5 min-w-5 items-center justify-center border border-white/20 px-1 text-[10px] tracking-normal text-white"
            data-empty={cartCount === 0}
          >
            {cartCount}
          </span>
        </button>
      </header>

      {/* bottom-left: sound toggle (wired to audio in Phase 8) */}
      <button
        onClick={onToggleSound}
        className="pointer-events-auto fixed z-40 flex min-h-[44px] items-end gap-[3px] bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-[max(1.75rem,env(safe-area-inset-left))]"
        aria-label="Toggle sound"
      >
        {[6, 11, 4, 9, 5].map((h, i) => (
          <span
            key={i}
            className="eq-bar w-[2px] origin-bottom bg-white-ghost"
            style={{ height: h, animationDelay: `${i * 0.12}s` }}
          />
        ))}
        <span className="ml-2 text-[10px] tracking-[0.28em] text-white-ghost">SOUND</span>
      </button>
    </>
  )
})

export default Hud
