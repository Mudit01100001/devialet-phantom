'use client'

import { Component, useEffect, useState, type ReactNode } from 'react'

const display = '[font-family:var(--font-italiana)]'

// On-brand failure poster. Shown when WebGL is unavailable or the 3D scene throws
// (e.g. a GLB 404). Replaces the old silent black screen — same void canvas,
// Italiana wordmark and ghost button as the rest of the site, no new vocabulary.
export function SceneFallback({ variant }: { variant: 'error' | 'unsupported' }) {
  const unsupported = variant === 'unsupported'
  return (
    <div
      role="alert"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-void px-6 text-center"
    >
      <div
        className={`${display} text-[clamp(2.6rem,15vw,7rem)] uppercase leading-none tracking-[0.16em] text-white/90 md:tracking-[0.3em]`}
      >
        Phantom
      </div>
      <p className="max-w-xs text-sm font-light leading-relaxed text-white-muted">
        {unsupported
          ? 'This experience renders in 3D and needs a browser with WebGL.'
          : 'The 3D experience could not be loaded.'}
      </p>
      {unsupported ? (
        <p className="text-[11px] uppercase tracking-[0.2em] text-white-ghost">
          Try the latest Chrome, Safari, Firefox or Edge
        </p>
      ) : (
        <button
          onClick={() => window.location.reload()}
          className="mt-1 cursor-pointer border border-white/25 px-6 py-3.5 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:border-white"
        >
          Reload
        </button>
      )}
    </div>
  )
}

// DOM-level boundary around the <Canvas> container: catches failures thrown while
// the Canvas / WebGL context itself is constructed (the part that lives in the
// regular React tree).
export class CanvasErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: unknown) {
    console.error('[Phantom] canvas failed to initialise:', error)
  }
  render() {
    return this.state.hasError ? <SceneFallback variant="error" /> : this.props.children
  }
}

// Boundary that lives INSIDE the Canvas (R3F's own reconciler). A suspense error
// from useGLTF (e.g. a missing GLB) throws here; we can't render a DOM poster from
// inside the 3D tree, so we render nothing in 3D and lift the failure to the DOM
// via onError, where Experience shows <SceneFallback>.
export class SceneErrorCatcher extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: unknown) {
    console.error('[Phantom] 3D scene failed to load:', error)
    this.props.onError()
  }
  render() {
    return this.state.hasError ? null : this.props.children
  }
}

// Feature-detect WebGL on the client. null = still checking (don't decide yet),
// true/false = answer. Gates whether the Canvas is mounted at all, so an
// unsupported browser never gets a dead black canvas.
export function useWebGLSupport(): boolean | null {
  const [supported, setSupported] = useState<boolean | null>(null)
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl =
        canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')
      setSupported(!!gl)
    } catch {
      setSupported(false)
    }
  }, [])
  return supported
}
