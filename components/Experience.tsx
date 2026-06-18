'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, useGLTF, useProgress } from '@react-three/drei'
import {
  BrightnessContrast,
  Bloom,
  EffectComposer,
  HueSaturation,
  Noise,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import Hud, { type HudHandle } from './Hud'
import {
  Sound,
  Presence,
  Connectivity,
  FindYourSound,
  Assurances,
  Professionals,
  Newsletter,
  SiteFooter,
} from './PostTake'
import {
  CanvasErrorBoundary,
  SceneErrorCatcher,
  SceneFallback,
  useWebGLSupport,
} from './SceneGuard'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import * as THREE from 'three'

gsap.registerPlugin(ScrollTrigger)


// Camera state, mutated by the scroll timeline and read every frame by CameraRig.
// az = orbit angle around the product, el = elevation, dist = distance,
// pulse = how hard the woofers are allowed to thump (peaks on the power beat).
// panX/panY slide the subject in SCREEN space as a FRACTION of the half-viewport
// (right/up positive), so the framing is identical on any window width — CameraRig
// converts the fraction to world units per-frame and clamps it so the model never
// clips the edges. Driven OPPOSITE the incoming text to break the centred look.
// stand = finish-section progress (0→1): raises the stand, arms drag, enables the
// turntable. Driven by the timeline, not raw scroll, so it stays in sync with the
// camera's arrival at the finish framing.
// acquire = the post-film "3D reappears to buy" progress (0→1). The film take ends
// at the finish beat; far below, a transparent acquire section scrubs this 0→1 and
// CameraRig blends the held finish framing toward ACQUIRE_VIEW (front-out, slid left).
const view = { az: 0.5, el: 0.12, dist: 11, pulse: 0.45, panX: 0, panY: 0, stand: 0, acquire: 0 }

// Live, render-cheap globals read every frame by CameraRig. MOBILE is toggled by
// a resize listener (NOT React state) so the camera reframes for portrait without
// ever rebuilding the GSAP/Lenis timeline. PROGRESS mirrors scroll progress so the
// mobile lift can stay off at the hero (which has no bottom copy to clear).
let MOBILE = false
let PROGRESS = 0

// Woofer drive signal — a synthetic groove (kick + offbeat ghost + slow swell).
// Architecture note: when Mudit supplies a song, replace this with a precomputed
// amplitude envelope (JSON array sampled ~60 Hz) and index it by time instead.
function groove(t: number) {
  const kick = Math.exp(-((t * 1.9) % 1) * 9)
  const ghost = Math.exp(-((t * 1.9 + 0.5) % 1) * 14) * 0.35
  const swell = 0.12 + 0.08 * Math.sin(t * 0.7)
  return kick + ghost + swell
}

// ── Audio (desktop only) ────────────────────────────────────────────────────
// Live analysis state, read every frame by the woofer reaction (same render-cheap
// global pattern as `view`). `analyser` stays null until the visitor enters WITH
// sound. gain / lowHz / highHz / volume are tuned live by the dev sliders on
// localhost, then baked in here as the shipped defaults.
const AUDIO = {
  analyser: null as AnalyserNode | null,
  data: null as Uint8Array<ArrayBuffer> | null,
  level: 0, // smoothed SIGNED swing around rest (±) — beats push out, dips pull in
  baseline: 0, // slow running average of band energy: the DC we subtract from `level`
  meter: 0, // |drive| this frame, for the dev level meter
  on: false, // playing AND not muted → woofers follow the music (else synthetic groove)
  reduced: false, // prefers-reduced-motion → damp the reactive amplitude
  // Defaults baked from Mudit's dev-tuner pass (16 Jun 2026).
  gain: 1.05, // swing AMPLITUDE only; the rest position never moves
  outLimit: 0.27, // max OUTWARD cone travel (scale fraction)
  inLimit: 0.05, // max INWARD travel; small so the cone never recedes into the (non-existent) interior
  lowHz: 60, // reactive range, low edge
  highHz: 1200, // reactive range, high edge
  volume: 0.6, // playback level (1.0 was full blast); also the user volume slider's start
}
const AUDIO_TRACK_FULL = '/phantom-track.m4a' // full ~2.3 min — higher-end devices
const AUDIO_TRACK_LOOP = '/phantom-track-loop.m4a' // lighter ~40 s loop — lower-end devices
const AUDIO_CREDIT = 'Decouverte by Grolok Panicrum'
const LOOK_Y = 1.5 // vertical centre of the product after normalisation
const MODEL_RADIUS = 2.2 // world-space half-extent, used to clamp pan so it never clips

type FinishId = 'gold' | 'rosegold' | 'matte-black'

// Real Blender material-variant exports (tweeter + logo finalised, one stand
// each). Each GLB is ~1.2 MB; all three preload so switching is instant.
const FINISH_URL: Record<FinishId, string> = {
  gold: '/finish_gold.glb',
  rosegold: '/finish_rosegold.glb',
  'matte-black': '/finish_black.glb',
}

const FINISH_META: { id: FinishId; label: string; dot: string }[] = [
  { id: 'gold', label: 'Gold', dot: '#e8e8e6' },
  { id: 'rosegold', label: 'Rose Gold', dot: '#d8a48c' },
  { id: 'matte-black', label: 'Black', dot: '#1c1c1e' },
]

// One finish's prepared scene: normalised on the body, with stand + woofer nodes
// located. All three stay mounted; only the active one is visible. (Swapping a
// single <primitive>'s object on rapid clicks races and blanks the canvas, so we
// toggle visibility instead.)
type Prepared = {
  id: FinishId
  scene: THREE.Group
  s: number
  offset: THREE.Vector3
  stands: { node: THREE.Object3D; baseY: number }[]
  drop: number // local-space distance the stand drops below its rest position
  woofers: { node: THREE.Object3D; baseX: number }[]
}

function prepare(id: FinishId, scene: THREE.Group): Prepared {
  let body: THREE.Object3D = scene
  const stands: { node: THREE.Object3D; baseY: number }[] = []
  const woofers: { node: THREE.Object3D; baseX: number }[] = []
  scene.traverse((o) => {
    const n = o.name.toLowerCase()
    if (n.includes('mainbody')) body = o
    if (n.includes('stand')) stands.push({ node: o, baseY: o.position.y })
    if (n.includes('woofer')) woofers.push({ node: o, baseX: o.scale.x })
  })
  const box = new THREE.Box3().setFromObject(body)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const s = 4 / Math.max(size.x, size.y, size.z)
  // Drop ~5 world units below rest (÷s converts world → this scene's local space).
  return { id, scene, s, offset: center.multiplyScalar(-s), stands, drop: 5 / s, woofers }
}

function Phantom({ finish }: { finish: FinishId }) {
  // Load all three finishes; all stay mounted, visibility toggled by `finish`.
  const gltfs = useGLTF([
    FINISH_URL.gold,
    FINISH_URL.rosegold,
    FINISH_URL['matte-black'],
  ])
  const models = useMemo<Prepared[]>(
    () => [
      prepare('gold', gltfs[0].scene as THREE.Group),
      prepare('rosegold', gltfs[1].scene as THREE.Group),
      prepare('matte-black', gltfs[2].scene as THREE.Group),
    ],
    [gltfs]
  )
  const group = useRef<THREE.Group>(null)
  const { gl } = useThree()

  // Hover state (raycast against a cheap invisible sphere, not the 240k-tri mesh)
  // and the one-shot thump fired by clicking the speaker in the finish section.
  const hover = useRef(0)
  const hoverTarget = useRef(0)
  const clickEnv = useRef(0)
  // Idle "grab me" hint: a soft periodic sway in the hero / finish / acquire views so
  // the speaker reads as draggable. Decays to nothing once the user first drags.
  const dragHint = useRef(1)

  // Drag-to-rotate, active only inside the finish section.
  const drag = useRef({ on: false, x: 0, y: 0, rx: 0, ry: 0 })
  useEffect(() => {
    const el = gl.domElement
    // Horizontal-only turntable: let the browser keep vertical panning (page
    // scroll) and pinch-zoom, but hand horizontal drags to us instead of
    // scrolling. Without this, touch devices claim the gesture for scrolling and
    // cancel the pointer stream, so the speaker can't be rotated on a phone/tablet.
    const prevTouchAction = el.style.touchAction
    el.style.touchAction = 'pan-y pinch-zoom'
    const down = (e: PointerEvent) => {
      // Grabbable everywhere: tumble it (X+Y, springs back) in every beat except the
      // finish/acquire section, which keeps its seated Y-only turntable that holds.
      dragHint.current = 0 // user found the drag — retire the "grab me" sway
      drag.current.on = true
      drag.current.x = e.clientX
      drag.current.y = e.clientY
      el.setPointerCapture?.(e.pointerId) // keep the stream if the finger leaves the canvas
    }
    const move = (e: PointerEvent) => {
      const d = drag.current
      if (!d.on) return
      // Spin around the vertical axis from horizontal drag.
      d.ry += (e.clientX - d.x) * 0.006
      // X-tilt only OUTSIDE the finish (in finish the speaker stays seated on its
      // stand). In the hero you can tumble it; clamp so it can't flip over.
      if (view.stand < 0.5) d.rx = Math.max(-0.6, Math.min(0.6, d.rx + (e.clientY - d.y) * 0.006))
      d.x = e.clientX
      d.y = e.clientY
    }
    const up = () => (drag.current.on = false)
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      el.style.touchAction = prevTouchAction
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [gl])

  useFrame(({ clock, pointer }) => {
    const t = clock.elapsedTime
    const d = drag.current
    const inFinish = view.stand > 0.5
    // Outside the finish section the drift/lean just ease back out. Inside it, the
    // user-set spin (ry) is held wherever it's left — no decay, no auto-righting.
    if (!d.on && !inFinish) {
      d.rx *= 0.94
      d.ry *= 0.94
    }
    hover.current += (hoverTarget.current - hover.current) * 0.08
    // Drag-discovery hint: a gentle there-and-back sway every ~4s, only in the views
    // where grabbing matters (hero / finish picker / acquire), fading after first drag.
    const inHintZone =
      !AUDIO.reduced && (PROGRESS < 0.08 || view.stand > 0.5 || view.acquire > 0.5)
    const hc = t % 4
    const hintEnv = hc < 1.2 ? Math.sin((hc / 1.2) * Math.PI) : 0 // 0→1→0 envelope over 1.2s
    const hint =
      dragHint.current * (inHintZone ? 1 : 0) * 0.07 * hintEnv * Math.sin((hc / 1.2) * Math.PI * 2)
    if (group.current) {
      const drift = Math.sin(t * 0.15) * 0.05 // micro-drift so it never feels frozen
      if (inFinish) {
        // Turntable: speaker + stand rotate together as one rigid unit and hold.
        // X eases to 0 so the speaker sits level on its stand — no tilt, no snap.
        group.current.rotation.y += (d.ry + hint - group.current.rotation.y) * 0.12
        group.current.rotation.x += (0 - group.current.rotation.x) * 0.12
      } else {
        // While hovered, the speaker leans toward the cursor.
        const leanY = pointer.x * 0.16 * hover.current
        const leanX = -pointer.y * 0.1 * hover.current
        group.current.rotation.y += (drift + d.ry + leanY + hint - group.current.rotation.y) * 0.12
        group.current.rotation.x += (d.rx + leanX - group.current.rotation.x) * 0.12
      }
    }
    // Groove-driven thump, gated by scroll position via view.pulse,
    // plus the one-shot boom from clicking the speaker in the finish section.
    clickEnv.current *= 0.93
    // Woofer drive: the LIVE track when playing, else the synthetic groove.
    let drive: number
    let pulseFactor: number
    if (AUDIO.on && AUDIO.analyser && AUDIO.data) {
      AUDIO.analyser.getByteFrequencyData(AUDIO.data)
      // RANGE: average every bin across [lowHz, highHz]. Narrow + low → tracks the
      // kick/bass (punchy, isolated hits); widen toward 20 kHz → tracks the whole
      // mix / overall loudness (syncs with what you hear on laptop speakers).
      const nyquist = AUDIO.analyser.context.sampleRate / 2
      const bins = AUDIO.data.length
      const toBin = (hz: number) => Math.max(0, Math.min(bins - 1, Math.round((hz / nyquist) * bins)))
      const lo = toBin(Math.min(AUDIO.lowHz, AUDIO.highHz))
      const hi = Math.max(lo, toBin(Math.max(AUDIO.lowHz, AUDIO.highHz)))
      let sum = 0
      for (let i = lo; i <= hi; i++) sum += AUDIO.data[i]
      const energy = sum / (hi - lo + 1) / 255 // 0–1
      // DC REMOVAL: subtract a slow running average so GAIN amplifies only the
      // VARIATION, never the floor. Between beats deviation≈0 → the cone rests at its
      // modelled position; beats push it OUT, dips pull it IN — symmetric, rest fixed.
      // Seed the baseline on the first frame (it's 0 at start / after a reset) so the
      // cone doesn't pop outward while a zero baseline converges; then track slowly.
      AUDIO.baseline = AUDIO.baseline === 0 ? energy : AUDIO.baseline + (energy - AUDIO.baseline) * 0.04
      const deviation = energy - AUDIO.baseline // signed, centred on 0
      // Smooth the swing (fast attack, slower release), preserving the sign.
      AUDIO.level += (deviation - AUDIO.level) * (deviation > AUDIO.level ? 0.5 : 0.15)
      // GAIN = swing amplitude (peak-to-trough). Because `deviation` is centred, the
      // rest position is unaffected by gain. Clamp asymmetrically: outLimit caps the
      // bulge, inLimit caps how far IN the cone can recede (so it never reveals the
      // non-existent interior).
      drive = Math.max(-AUDIO.inLimit, Math.min(AUDIO.outLimit, AUDIO.level * AUDIO.gain * (AUDIO.reduced ? 0.4 : 1) * 0.9))
      AUDIO.meter = Math.abs(drive)
      pulseFactor = 0.6 + 0.4 * view.pulse // always moving, harder on the power beat
    } else {
      drive = groove(t) * 0.05
      AUDIO.level = drive
      AUDIO.meter = Math.abs(drive)
      pulseFactor = view.pulse
    }
    const thump = drive * pulseFactor + clickEnv.current * 0.09
    // Stand rises from below as the timeline drives view.stand 0→1 (eased).
    const rise = THREE.MathUtils.smoothstep(view.stand, 0, 1)
    for (const m of models) {
      // Only the active model animates; stands belong to the active finish only.
      const on = m.id === finish
      for (const w of m.woofers) w.node.scale.x = w.baseX * (1 + (on ? thump : 0))
      for (const s of m.stands) {
        s.node.position.y = s.baseY - (1 - rise) * m.drop
        s.node.visible = on && rise > 0.001
      }
    }
  })

  return (
    <group ref={group} position={[0, LOOK_Y, 0]}>
      {/* all three stay mounted; only the active finish is visible. body centred
          at the group origin so the stand hangs below it. */}
      {models.map((m) => (
        <primitive
          key={m.id}
          object={m.scene}
          visible={m.id === finish}
          scale={m.s}
          position={m.offset}
        />
      ))}
      {/* invisible raycast proxy: hover + click without touching the dense mesh */}
      <mesh
        visible={false}
        position={[0, 0, 0]}
        onPointerOver={() => (hoverTarget.current = 1)}
        onPointerOut={() => (hoverTarget.current = 0)}
        onClick={(e) => {
          if (view.stand > 0.5 && e.delta < 6) clickEnv.current = 1
        }}
      >
        <sphereGeometry args={[2.5, 16, 16]} />
      </mesh>
    </group>
  )
}

// Reusable temporaries for the camera pan maths (no per-frame allocation).
const _target = new THREE.Vector3()
const _camPos = new THREE.Vector3()
const _fwd = new THREE.Vector3()
const _right = new THREE.Vector3()
const _up = new THREE.Vector3()
const _worldUp = new THREE.Vector3(0, 1, 0)
const _pan = new THREE.Vector3()

function CameraRig() {
  // Damped camera: follows the scroll-driven view target, plus a subtle
  // cursor parallax so the scene reacts to the mouse everywhere on the page.
  const cur = useRef({ az: view.az, el: view.el, dist: view.dist, panX: 0, panY: 0 })
  useFrame(({ camera, pointer }) => {
    const c = cur.current
    // On mobile, past the hero, swap the horizontal pan for a pull-back + upward
    // lift so the model sits in the top half and the bottom-anchored copy clears
    // it. Damped like everything else, so toggling MOBILE on resize eases in.
    // Acquire reveal: when the post-film buying section scrubs view.acquire 0→1,
    // blend the held finish framing toward ACQUIRE_VIEW (front turns out, speaker
    // slides left for the panel on the right). a=0 during the film → no effect.
    const a = view.acquire
    const vAz = view.az + (ACQUIRE_VIEW.az - view.az) * a
    const vEl = view.el + (ACQUIRE_VIEW.el - view.el) * a
    const vDist = view.dist + (ACQUIRE_VIEW.dist - view.dist) * a
    const vPanX = view.panX + (ACQUIRE_VIEW.panX - view.panX) * a
    const vPanY = view.panY + (ACQUIRE_VIEW.panY - view.panY) * a

    const lift = MOBILE && PROGRESS > 0.04
    const tDist = lift ? vDist * MOBILE_DIST : vDist
    const tPanX = lift ? 0 : vPanX
    const tPanY = lift ? MOBILE_LIFT : vPanY
    c.az += (vAz + pointer.x * 0.13 - c.az) * 0.08
    c.el += (vEl + pointer.y * 0.08 - c.el) * 0.08
    c.dist += (tDist - c.dist) * 0.08
    c.panX += (tPanX - c.panX) * 0.08
    c.panY += (tPanY - c.panY) * 0.08
    const r = c.dist * Math.cos(c.el)
    _target.set(0, LOOK_Y, 0)
    _camPos.set(Math.sin(c.az) * r, LOOK_Y + c.dist * Math.sin(c.el), Math.cos(c.az) * r)
    // Convert the screen-fraction pan to world units using the LIVE viewport: the
    // visible half-extents at the subject depend on fov, distance and aspect, so
    // this reframes itself on any window size. The clamp keeps the model's own
    // radius inside the frame — on a wide window it can slide far, on a narrow one
    // it slides little (or not at all), but it never clips an edge.
    const persp = camera as THREE.PerspectiveCamera
    const halfH = Math.tan((persp.fov * Math.PI) / 360) * c.dist
    const halfW = halfH * persp.aspect
    const maxFracX = Math.max(0, 0.92 - MODEL_RADIUS / halfW)
    const maxFracY = Math.max(0, 0.92 - MODEL_RADIUS / halfH)
    const worldPanX = THREE.MathUtils.clamp(c.panX, -maxFracX, maxFracX) * halfW
    const worldPanY = THREE.MathUtils.clamp(c.panY, -maxFracY, maxFracY) * halfH
    // Truck the camera and its target together along screen-right/up so the
    // subject slides on screen by the chosen fraction, whatever the orbit angle.
    _fwd.copy(_target).sub(_camPos).normalize()
    _right.copy(_fwd).cross(_worldUp).normalize()
    _up.copy(_right).cross(_fwd).normalize()
    _pan.copy(_right).multiplyScalar(-worldPanX).addScaledVector(_up, -worldPanY)
    camera.position.copy(_camPos).add(_pan)
    _target.add(_pan)
    camera.lookAt(_target)
  })
  return null
}

// Custom studio: one soft key from above, two long strips for the specular
// streaks along the glossy shell, and a warm rim from behind for the gold.
function Studio({ finish }: { finish: FinishId }) {
  return (
    <Environment resolution={512}>
      {/* no scene background — transparent canvas lets the CSS void (#000) show through */}
      <Lightformer
        form="rect"
        intensity={3}
        position={[0, 6, 0]}
        rotation-x={Math.PI / 2}
        scale={[12, 12, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1.8}
        position={[-6, 1.6, 2]}
        rotation-y={Math.PI / 2}
        scale={[8, 0.8, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1.1}
        position={[6, 2.2, -1]}
        rotation-y={-Math.PI / 2}
        scale={[9, 0.6, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1.4}
        color="#ffe3b3"
        position={[0, 3, -6]}
        rotation-y={Math.PI}
        scale={[5, 3, 1]}
      />
      {/* FRONT FILL — a big soft panel on the camera side so the front board (and
          any black face that points at the lens) has something bright to reflect.
          Without this a black surface mirrors the empty void and reads dead-flat.
          Large + low intensity = a smooth gradient that reveals form, never clips. */}
      <Lightformer
        form="rect"
        intensity={1.1}
        position={[2.5, 3.2, 7]}
        scale={[10, 8, 1]}
      />
      {/* MATTE-BLACK-ONLY fill rig. The black body has no diffuse, so it only shows
          reflections; with the global key/rim all above-and-behind, its sides, bottom
          and stand go dead-black. These extra panels give those faces something to
          reflect. Warm stays at the TOP (global rim); everything added here is neutral
          / white. Gated on the finish so gold/white never see them. */}
      {finish === 'matte-black' && (
        <>
          {/* bottom fill — neutral (de-warmed), mirrors the top onto the underside */}
          <Lightformer
            form="rect"
            intensity={2.2}
            color="#f5f5f5"
            position={[0, -4.5, 2]}
            rotation-x={-Math.PI / 2}
            scale={[9, 7, 1]}
          />
          {/* front-bottom fill — lifts the whole lower shell toward the camera */}
          <Lightformer
            form="rect"
            intensity={2.2}
            color="#ffffff"
            position={[0, -3, 5]}
            rotation-x={-Math.PI / 3}
            scale={[6, 4.5, 1]}
          />
          {/* left + right white edge highlights — define the side edges */}
          <Lightformer
            form="rect"
            intensity={2.6}
            color="#ffffff"
            position={[-7, 1.2, 1.5]}
            rotation-y={Math.PI / 2}
            scale={[3.5, 6, 1]}
          />
          <Lightformer
            form="rect"
            intensity={2.6}
            color="#ffffff"
            position={[7, 1.2, 1.5]}
            rotation-y={-Math.PI / 2}
            scale={[3.5, 6, 1]}
          />
          {/* dedicated stand light — the stand sits low + dead-black without this */}
          <Lightformer
            form="rect"
            intensity={3.0}
            color="#ffffff"
            position={[0, -4.5, 4]}
            rotation-x={-Math.PI / 2.3}
            scale={[4.5, 4, 1]}
          />
        </>
      )}
    </Environment>
  )
}

// Cinematic post stack. Bloom is selective via luminanceThreshold≈1, so only the
// chrome/gold speculars (driven past 1.0 by the Lightformer studio) glint. Noise
// kills banding in the dark gradients; ToneMapping is LAST (maps HDR→display).
function Effects({ finish }: { finish: FinishId }) {
  const brightness = finish === 'matte-black' ? -0.01 + 0.08 : -0.01
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur luminanceThreshold={1.0} intensity={0.42} radius={0.7} />
      <BrightnessContrast brightness={brightness} contrast={0.07} />
      <HueSaturation saturation={-0.08} />
      <Noise opacity={0.045} premultiply blendFunction={BlendFunction.SOFT_LIGHT} />
      <Vignette offset={0.3} darkness={0.78} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  )
}

const display = '[font-family:var(--font-italiana)]'

// Entry gate. While the scene loads it doubles as the preloader. On a desktop-width
// window it then offers "Enter with sound" — the click is the gesture that unlocks
// AND starts loading Web Audio (we deliberately do NOT wait for the track to
// preload: Safari often won't buffer media until playback, which would otherwise
// hang the gate) — and a quiet "Enter without sound". Mobile/touch reveals silently.
function EntryGate({
  soundCapable,
  audioErrored,
  onEnter,
}: {
  soundCapable: boolean
  audioErrored: boolean
  onEnter: (withSound: boolean) => void
}) {
  const { progress, active } = useProgress()
  const sceneLoaded = !active && progress >= 100
  const [entering, setEntering] = useState(false)
  const [gone, setGone] = useState(false)

  // Offer sound the instant the scene is ready on desktop — do NOT wait for the
  // track to preload (Safari defers media until playback, which would hang here).
  // Only a hard load error (404 / unsupported) sends it down the silent path.
  const offerChoice = sceneLoaded && soundCapable && !audioErrored
  const autoSilent = sceneLoaded && (!soundCapable || audioErrored)

  const go = (withSound: boolean) => {
    if (entering) return
    onEnter(withSound)
    setEntering(true)
  }

  // Silent auto-reveal (mobile, or no track present) — no gesture, no audio.
  useEffect(() => {
    if (autoSilent && !entering) go(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSilent])

  // Fade out, then unmount.
  useEffect(() => {
    if (!entering) return
    const t = setTimeout(() => setGone(true), 700)
    return () => clearTimeout(t)
  }, [entering])

  if (gone) return null
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-10 bg-void px-6 text-center transition-opacity duration-700"
      style={{ opacity: entering ? 0 : 1, pointerEvents: entering ? 'none' : 'auto' }}
      aria-hidden={entering}
    >
      <div className={`${display} text-[14vw] leading-none tracking-[0.16em] text-white/90 md:text-[clamp(3rem,9vw,8rem)] md:tracking-[0.3em]`}>
        PHANTOM
      </div>

      <p className="-mt-4 text-[10px] uppercase tracking-[0.32em] text-white-ghost">
        Concept site · cannot order from here
      </p>

      {!sceneLoaded ? (
        <div className="flex flex-col items-center gap-3">
          <div className="h-px w-40 overflow-hidden bg-white/15">
            <div className="h-full bg-white transition-[width] duration-300 ease-out" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-[10px] tracking-[0.4em] text-white-ghost">{Math.round(progress)}%</div>
        </div>
      ) : offerChoice ? (
        <div className="flex flex-col items-center gap-5">
          <button
            onClick={() => go(true)}
            className="min-h-[44px] cursor-pointer border border-white/30 px-9 py-3.5 text-[11px] uppercase tracking-[0.28em] text-white transition-colors hover:border-white hover:bg-white hover:text-void"
          >
            Enter with sound
          </button>
          <button
            onClick={() => go(false)}
            className="cursor-pointer text-[10px] uppercase tracking-[0.28em] text-white-ghost transition-colors hover:text-white-muted"
          >
            Enter without sound
          </button>
        </div>
      ) : null}
    </div>
  )
}

// Dev-only (localhost) tuning panel: dial in the woofer reaction against the real
// track. Swing = amplitude (rest stays fixed); Range low/high = which frequencies
// drive it; Volume = playback level. The values get baked into AUDIO once chosen;
// this panel never ships (gated on NODE_ENV). onVolume applies volume to the live
// gain node (respecting mute).
function AudioTuner() {
  const [gain, setGain] = useState(AUDIO.gain)
  const [outLimit, setOutLimit] = useState(AUDIO.outLimit)
  const [inLimit, setInLimit] = useState(AUDIO.inLimit)
  const [lowHz, setLowHz] = useState(AUDIO.lowHz)
  const [highHz, setHighHz] = useState(AUDIO.highHz)
  const meterRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      if (meterRef.current) meterRef.current.style.width = `${Math.min(100, AUDIO.meter * 300)}%`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  const row = 'mt-4 block text-[10px] uppercase tracking-[0.18em] text-white-muted'
  return (
    <div className="pointer-events-auto fixed right-4 top-20 z-[80] w-64 border border-white/15 bg-black/80 p-4 text-white">
      <div className="mb-1 text-[10px] uppercase tracking-[0.28em] text-white-ghost">Audio tuner — dev only</div>
      <label className="mt-3 block text-[10px] uppercase tracking-[0.18em] text-white-muted">
        Woofer swing · {gain.toFixed(2)}
        <input
          type="range" min={0} max={4} step={0.05} value={gain}
          onChange={(e) => { const v = +e.target.value; setGain(v); AUDIO.gain = v }}
          className="mt-1 w-full"
        />
      </label>
      <label className={row}>
        Out limit · {outLimit.toFixed(2)}
        <input
          type="range" min={0} max={0.5} step={0.01} value={outLimit}
          onChange={(e) => { const v = +e.target.value; setOutLimit(v); AUDIO.outLimit = v }}
          className="mt-1 w-full"
        />
      </label>
      <label className={row}>
        In limit · {inLimit.toFixed(2)}
        <input
          type="range" min={0} max={0.3} step={0.01} value={inLimit}
          onChange={(e) => { const v = +e.target.value; setInLimit(v); AUDIO.inLimit = v }}
          className="mt-1 w-full"
        />
      </label>
      <label className={row}>
        Range low · {lowHz} Hz
        <input
          type="range" min={20} max={2000} step={10} value={lowHz}
          onChange={(e) => { const v = +e.target.value; setLowHz(v); AUDIO.lowHz = v }}
          className="mt-1 w-full"
        />
      </label>
      <label className={row}>
        Range high · {highHz >= 1000 ? `${(highHz / 1000).toFixed(1)}k` : highHz} Hz
        <input
          type="range" min={100} max={20000} step={100} value={highHz}
          onChange={(e) => { const v = +e.target.value; setHighHz(v); AUDIO.highHz = v }}
          className="mt-1 w-full"
        />
      </label>
      <div className="mt-4 h-1 w-full overflow-hidden bg-white/15">
        <div ref={meterRef} className="h-full bg-white" style={{ width: '0%' }} />
      </div>
      <div className="mt-1 text-[9px] tracking-[0.1em] text-white-ghost">live woofer level</div>
    </div>
  )
}

// Dev-only (localhost) universal corner-radius slider. Writes --radius on :root, so
// every retail box/card/image (which read `rounded-[var(--radius)]`) updates live.
// Never ships (gated on NODE_ENV at the mount). Bottom-right so it clears the tuner.
function RadiusTuner() {
  const [r, setR] = useState(12)
  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-[80] w-56 border border-white/15 bg-black/80 p-4 text-white">
      <div className="mb-1 text-[10px] uppercase tracking-[0.28em] text-white-ghost">Radius · dev only</div>
      <label className="mt-2 block text-[10px] uppercase tracking-[0.18em] text-white-muted">
        Corner radius · {r}px
        <input
          type="range"
          min={0}
          max={28}
          step={1}
          value={r}
          onChange={(e) => {
            const v = +e.target.value
            setR(v)
            document.documentElement.style.setProperty('--radius', `${v}px`)
          }}
          className="mt-1 w-full"
        />
      </label>
    </div>
  )
}

// Per-beat camera framing (beats 1–5: shape, power, detail, spine, finish).
// panX/panY are SCREEN fractions, set OPPOSITE the text so the speaker travels
// away from the incoming copy. The finish beat — now the LAST beat of the film —
// pans slightly DOWN (panY < 0) so the speaker sits LOWER than the picker.
const CAM = [
  { az: 1.25, el: 0.06, dist: 9.6, pulse: 0.18, panX: 0.42, panY: 0 }, // shape  — text left,  speaker right
  { az: 1.95, el: 0.0, dist: 7.6, pulse: 1.0, panX: -0.42, panY: 0 }, // power  — text right, speaker left
  { az: -0.12, el: 0.05, dist: 7.2, pulse: 0.18, panX: 0.42, panY: 0 }, // detail — text left,  speaker right
  { az: -2.85, el: 0.18, dist: 8.6, pulse: 0.18, panX: -0.42, panY: 0 }, // spine  — text right, speaker left
  { az: -5.73, el: 0.2, dist: 9.6, pulse: 0.3, panX: 0, panY: -0.12 }, // finish — picker top, speaker low (raised el: less grazing → matte-black survives)
] as const

// The buying framing for the post-film ACQUIRE reveal (was the old beat-6 acquire
// shot). The speaker slides LEFT and turns its FRONT toward the buying panel on the
// right. CameraRig blends from the held finish framing toward this by view.acquire.
const ACQUIRE_VIEW = { az: -7.85, el: 0.1, dist: 11, panX: -0.55, panY: 0 } as const

// Mobile reframing constants. A narrow portrait viewport has no horizontal room
// for the desktop "speaker pans away from the side copy" trick, so CameraRig
// switches axes when MOBILE: pull the camera back (model fits the narrow frame)
// and lift the model into the TOP (panY > 0) so the copy — which CSS anchors to
// the BOTTOM on mobile — never collides with it. Same orbit angles, so the take
// is preserved; only the framing adapts. The lift holds off at the hero (no
// bottom copy there) and eases in once scrolled past it.
const MOBILE_DIST = 1.5 // distance multiplier so the model fits a portrait frame
const MOBILE_LIFT = 0.3 // screen-fraction the model rises into the top half

export default function Experience() {
  const main = useRef<HTMLDivElement>(null)
  const heroWrap = useRef<HTMLDivElement>(null) // fades out on scroll
  const heroWord = useRef<HTMLHeadingElement>(null) // parallax with cursor
  const hud = useRef<HudHandle>(null)
  const lenisRef = useRef<Lenis | null>(null)
  // Cart drawer focus management + the reduced-motion flag (set in the main effect,
  // read by seek()).
  const cartPanelRef = useRef<HTMLElement>(null)
  const cartReturnRef = useRef<HTMLElement | null>(null)
  const reducedRef = useRef(false)
  // Scroll progress (0–1) at which each beat is centred — populated by the timeline
  // effect, read by the keyboard navigation handler to jump beat-to-beat.
  const peakRef = useRef<number[]>([])
  // The fixed beat-text overlay (film copy + finish picker). Faded out as the
  // post-film acquire reveal scrubs in, so the finish picker never bleeds through
  // the transparent acquire section sitting above it.
  const overlayRef = useRef<HTMLDivElement>(null)
  // The post-film acquire section — its ScrollTrigger drives view.acquire 0→1.
  const acquireRef = useRef<HTMLElement>(null)
  // Audio (desktop only, gesture-unlocked). Created lazily; null until entered.
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const [soundCapable, setSoundCapable] = useState(false)
  const [audioErrored, setAudioErrored] = useState(false)
  const [audioOn, setAudioOn] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(AUDIO.volume)
  // Volume slider reveal: state-driven (pointer enter/leave) rather than pure CSS
  // :hover, which intermittently missed because the collapsed slider gave the group
  // a hairline hit area. A padded hover zone + state makes it open every time.
  const [volOpen, setVolOpen] = useState(false)
  // Text blocks, one per beat (0 = hero). Animated in/out by the master timeline.
  const beatRefs = useRef<(HTMLDivElement | null)[]>([])
  const setBeat = (i: number) => (el: HTMLDivElement | null) => {
    beatRefs.current[i] = el
  }
  const [finish, setFinish] = useState<FinishId>('gold')
  // Silent-failure guards: webgl === false → unsupported poster instead of a dead
  // canvas; sceneError → the 3D tree threw (e.g. a GLB 404) and lifted up here.
  const webgl = useWebGLSupport()
  const [sceneError, setSceneError] = useState(false)
  // concept cart — adds work, ordering is out of scope. Each add records the
  // finish chosen at the time, so the cart drawer can list real line items.
  const [cart, setCart] = useState<{ id: number; label: string; price: string }[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  // True while the light retail interlude is under the top bar — flips the HUD +
  // bottom-left sound control to dark ink so they stay legible on the paper sections.
  const [overLight, setOverLight] = useState(false)
  const lightRef = useRef<HTMLDivElement>(null)
  const selected = FINISH_META.find((f) => f.id === finish) ?? FINISH_META[0]
  const PRICE = '€2,990'
  const addToCart = () => setCart((c) => [...c, { id: Date.now() + Math.random(), label: selected.label, price: PRICE }])

  // Smooth-scroll to a target progress (used by the brand wordmark + cart).
  const seek = (progress: number) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    lenisRef.current?.scrollTo(progress * max, {
      duration: reducedRef.current ? 0 : 1.4,
      immediate: reducedRef.current,
    })
  }

  // Detect a sound-capable device (desktop width + fine pointer); mobile/touch stays
  // silent. Tracks resize/rotation so the gate offers (or hides) sound correctly.
  useEffect(() => {
    const mqW = window.matchMedia('(max-width: 768px)')
    const mqP = window.matchMedia('(pointer: fine)')
    const update = () => setSoundCapable(!mqW.matches && mqP.matches)
    update()
    mqW.addEventListener('change', update)
    mqP.addEventListener('change', update)
    return () => {
      mqW.removeEventListener('change', update)
      mqP.removeEventListener('change', update)
    }
  }, [])

  // Best-effort preload on capable devices so the track can start quickly. We do NOT
  // block the entry gate on this — Safari often won't buffer media until playback, so
  // the actual load+play is kicked by the "Enter with sound" gesture in enterExperience.
  useEffect(() => {
    if (!soundCapable) return
    // Device-tiered: lower-powered machines get the lighter ~40 s loop (≈0.65 MB);
    // higher-end get the full track (≈2.25 MB). hardwareConcurrency is the most
    // cross-browser power proxy (Chrome/Safari/Firefox all expose it).
    const highEnd = (navigator.hardwareConcurrency || 4) >= 8
    const el = new Audio(highEnd ? AUDIO_TRACK_FULL : AUDIO_TRACK_LOOP)
    el.loop = true
    el.preload = 'auto'
    const failed = () => {
      setAudioErrored(true) // 404 / unsupported → reveal silently
      audioElRef.current = null // don't try to play a broken element
    }
    el.addEventListener('error', failed)
    audioElRef.current = el
    el.load()
    return () => {
      el.pause()
      el.removeEventListener('error', failed)
    }
  }, [soundCapable])

  // Reset the module-level AUDIO state on unmount (it outlives this component, so
  // stale baseline/level would otherwise cause a 1-frame jitter on the next mount).
  useEffect(
    () => () => {
      AUDIO.on = false
      AUDIO.analyser = null
      AUDIO.data = null
      AUDIO.baseline = 0
      AUDIO.level = 0
      AUDIO.meter = 0
      audioCtxRef.current?.close().catch(() => {})
    },
    [],
  )

  // Enter the experience. `withSound` builds the Web Audio graph INSIDE the click
  // gesture (required by autoplay policy) and starts the looping track.
  const enterExperience = (withSound: boolean) => {
    // AUDIO.analyser set ⇒ the graph is already built; createMediaElementSource throws
    // if called twice on the same element, so make re-entry a no-op.
    if (!withSound || !audioElRef.current || AUDIO.analyser) return
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new Ctx()
      audioCtxRef.current = ctx
      const src = ctx.createMediaElementSource(audioElRef.current)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048 // finer low-end resolution for the range control
      analyser.smoothingTimeConstant = 0.75
      const gainNode = ctx.createGain()
      gainNode.gain.value = muted ? 0 : AUDIO.volume
      gainRef.current = gainNode
      // analyser BEFORE the gain node → the woofer reaction reads the full-level
      // signal and is independent of the listening volume. (It keeps running even when
      // muted, which is why the woofers are gated on AUDIO.on, not on the gain value.)
      src.connect(analyser)
      analyser.connect(gainNode)
      gainNode.connect(ctx.destination)
      AUDIO.analyser = analyser
      AUDIO.data = new Uint8Array(analyser.frequencyBinCount)
      void ctx.resume()
      audioElRef.current
        .play()
        .then(() => {
          AUDIO.on = true
          setAudioOn(true)
        })
        .catch(() => {
          /* blocked → stay silent */
        })
    } catch {
      /* no Web Audio → stay silent */
    }
  }

  // Bottom-left mute toggle: ramp the gain node to silence (no click) AND stop
  // audio-driving the woofers (they fall back to the synthetic groove), so muted
  // never means "thumping in silence".
  const toggleMute = () => {
    const ctx = audioCtxRef.current
    const gn = gainRef.current
    if (!ctx || !gn) return
    const next = !muted
    setMuted(next)
    void ctx.resume()
    gn.gain.setTargetAtTime(next ? 0 : AUDIO.volume, ctx.currentTime, 0.03)
    AUDIO.on = !next
  }

  // User-facing volume (the hover slider on the sound button). Stores the value and
  // ramps the live gain node, unless muted (mute holds the node at 0; unmuting reads
  // the stored AUDIO.volume).
  const setVol = (v: number) => {
    setVolume(v)
    AUDIO.volume = v
    const ctx = audioCtxRef.current
    if (ctx && gainRef.current && !muted) gainRef.current.gain.setTargetAtTime(v, ctx.currentTime, 0.02)
  }

  useEffect(() => {
    // Honour prefers-reduced-motion: drop the smooth-scroll inertia, the text
    // blur/Z-fly, the cursor parallax and the scrub lag so the page tracks scroll
    // 1:1 with no autonomous glide. The scroll-driven camera itself stays (it IS
    // the content) but no longer drifts on its own.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    reducedRef.current = reduced
    AUDIO.reduced = reduced

    // Smooth but light scroll: higher lerp = less glide/more responsive (the old
    // 0.06 felt heavy to navigate); wheelMultiplier 1 tracks the wheel 1:1.
    // Reduced motion → lerp 1 + no smooth wheel ≈ native scroll, no inertia.
    const lenis = new Lenis({
      lerp: reduced ? 1 : 0.1,
      wheelMultiplier: reduced ? 1 : 1,
      smoothWheel: !reduced,
    })
    lenisRef.current = lenis
    // Keep ScrollTrigger in sync, and hide the top nav on scroll-down / reveal it on
    // scroll-up (always shown near the top). Driven imperatively → no React render.
    let lastScrollY = 0
    lenis.on('scroll', (e: { scroll?: number }) => {
      ScrollTrigger.update()
      const y = typeof e?.scroll === 'number' ? e.scroll : window.scrollY
      if (y <= 120) hud.current?.setHidden(false)
      else if (y > lastScrollY + 2) hud.current?.setHidden(true)
      else if (y < lastScrollY - 2) hud.current?.setHidden(false)
      lastScrollY = y
    })
    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    // Behind-the-speaker wordmark drifts opposite the cursor for a parallax/depth
    // read (the opaque speaker, painted on top, occludes its middle).
    const onMove = (e: PointerEvent) => {
      if (!heroWord.current) return
      const nx = e.clientX / window.innerWidth - 0.5
      const ny = e.clientY / window.innerHeight - 0.5
      heroWord.current.style.transform = `translate(${-nx * 46}px, ${-ny * 26}px)`
    }
    if (!reduced) window.addEventListener('pointermove', onMove)

    // Mobile flag for the camera reframing — a plain matchMedia listener that
    // mutates the module global. No React state, so the timeline never rebuilds.
    const mq = window.matchMedia('(max-width: 768px)')
    const onMQ = () => {
      MOBILE = mq.matches
    }
    onMQ()
    mq.addEventListener('change', onMQ)

    const beats = beatRefs.current
    beats.forEach((el) => {
      if (el) el.style.willChange = 'transform, opacity, filter'
    })

    // Camera rhythm: each beat is MOVE (camera travels) → TIN (settle) → HOLD
    // (still, reading time). The camera timeline below only drives `view`; the TEXT
    // is driven separately and DETERMINISTICALLY by updateText() from scroll
    // progress, so a block's state is a pure function of where you are.
    const MOVE = 0.7
    const TIN = 0.5
    const HOLD = 0.95
    const HERO_HOLD = 0.5
    const TAIL = 0.3
    const beatLen = MOVE + TIN + HOLD
    const total = HERO_HOLD + (beats.length - 1) * beatLen + TAIL
    // Progress at which each beat is dead-centre on screen (middle of its HOLD).
    // Derived from the same constants so it can't drift from the camera rhythm.
    const PEAK = beats.map((_, i) =>
      i === 0 ? 0 : (HERO_HOLD + (i - 1) * beatLen + MOVE + TIN + HOLD / 2) / total
    )
    peakRef.current = PEAK // expose to the keyboard navigation handler
    const lastIdx = beats.length - 1

    // Z-depth reveal (Locomotive-style). Each beat has a sharp "read" plateau
    // around its PEAK; outside it the copy travels back along Z, blurs, and fades.
    // Hero only recedes (it owns the top); the finish only approaches (it owns the
    // bottom, stays sharp + interactive). t: 0 = sharp & readable, 1 = gone.
    const READ = 0.05 // half-width of the fully-sharp plateau (covers the HOLD)
    const TRANS = 0.09 // travel/blur distance from plateau edge to fully gone
    // Reduced motion → no blur and no Z-fly; the beat copy simply cross-fades.
    const DEPTH = reduced ? 0 : 520 // px of translateZ at the far end (perspective shrink)
    const MAXBLUR = reduced ? 0 : 7 // px of blur at the far end
    const smooth = (x: number) => x * x * (3 - 2 * x)
    const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)

    const updateText = (p: number) => {
      for (let i = 0; i < beats.length; i++) {
        const el = beats[i]
        if (!el) continue
        const d = p - PEAK[i]
        let t: number
        if (i === 0) t = clamp01((d - READ) / TRANS) // hero: sharp at top, recede after
        else if (i === lastIdx) t = clamp01((-d - READ) / TRANS) // finish: approach, then stay sharp + interactive (picker)
        else t = clamp01((Math.abs(d) - READ) / TRANS) // middle (incl. finish): rise to sharp, sink away
        const vis = 1 - smooth(t)
        el.style.opacity = vis.toFixed(3)
        el.style.filter = t > 0 ? `blur(${(t * MAXBLUR).toFixed(2)}px)` : 'none'
        // hero is a full-screen overlay — fade/blur only, no Z push.
        if (i !== 0) el.style.transform = `perspective(1100px) translateZ(${(-t * DEPTH).toFixed(1)}px)`
        el.style.visibility = vis < 0.005 ? 'hidden' : 'visible'
      }
      // PHANTOM wordmark (behind the canvas) fades within the first sliver of scroll.
      if (heroWrap.current) heroWrap.current.style.opacity = Math.max(0, 1 - p / 0.045).toFixed(3)
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: main.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: reduced ? true : 0.8,
        onUpdate: (self) => {
          PROGRESS = self.progress
          updateText(self.progress)
        },
      },
    })

    tl.to({}, { duration: HERO_HOLD }) // hold on the hero before anything moves

    // Finish is the LAST beat of the film now (acquire moved to the post-film
    // reveal). The stand rises as the camera arrives at finish and STAYS up — it
    // persists past the timeline into the acquire reveal (which shows the speaker
    // on its stand). Drag stays armed via view.stand in both.
    const FINISH_BEAT = beats.length - 1
    beats.forEach((b, i) => {
      if (i === 0 || !b) return
      const cam = CAM[i - 1]
      tl.to(view, {
        az: cam.az, el: cam.el, dist: cam.dist, pulse: cam.pulse,
        panX: cam.panX, panY: cam.panY,
        duration: MOVE, ease: 'power1.inOut',
      })
      if (i === FINISH_BEAT) tl.to(view, { stand: 1, duration: MOVE * 0.85, ease: 'power2.out' }, '<')
      tl.to({}, { duration: TIN }) // settle — copy rises to sharp via updateText
      tl.to({}, { duration: HOLD }) // hold — reading time
    })
    tl.to({}, { duration: TAIL }) // tail so the finish picker holds to the very bottom of the film

    updateText(0) // paint the initial (hero) state before the first scroll event

    // Post-film ACQUIRE reveal. A transparent section far below the film scrubs
    // view.acquire 0→1 as it rises into view; CameraRig blends the held finish
    // framing toward ACQUIRE_VIEW (speaker turns front-out and slides left). The
    // film's fixed text overlay fades out in lock-step so the finish picker can't
    // bleed through the transparent acquire section stacked above it. Reversible:
    // scrolling back up runs progress→0, restoring the film framing + overlay.
    const acquireST = ScrollTrigger.create({
      trigger: acquireRef.current,
      start: 'top bottom', // section top enters from the viewport bottom
      end: 'top top', // section top reaches the viewport top (panel then pinned by sticky)
      scrub: reduced ? true : 0.8,
      onUpdate: (self) => {
        view.acquire = self.progress
        if (overlayRef.current) overlayRef.current.style.opacity = (1 - self.progress).toFixed(3)
      },
    })

    // Flip the HUD/sound chrome to dark ink while the light retail interlude spans
    // the top of the viewport (the white-on-black HUD is invisible on paper). Not a
    // per-frame toggle — fires only on enter/leave, so the extra renders are cheap.
    const lightST = ScrollTrigger.create({
      trigger: lightRef.current,
      start: 'top top',
      end: 'bottom top',
      onToggle: (self) => setOverLight(self.isActive),
    })

    return () => {
      window.removeEventListener('pointermove', onMove)
      mq.removeEventListener('change', onMQ)
      tl.scrollTrigger?.kill()
      tl.kill()
      acquireST.kill()
      lightST.kill()
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [])

  // Cart drawer accessibility: while open, trap Tab inside the drawer, close on
  // Escape, and return focus to whatever opened it. The drawer stays mounted (it
  // just fades), so `inert` on the closed state keeps its controls out of the tab
  // order and the a11y tree.
  useEffect(() => {
    if (!cartOpen) return
    cartReturnRef.current = (document.activeElement as HTMLElement) ?? null
    const panel = cartPanelRef.current
    const focusables = () =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])',
            ),
          )
        : []
    focusables()[0]?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCartOpen(false)
        return
      }
      if (e.key !== 'Tab') return
      const f = focusables()
      if (f.length === 0) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      cartReturnRef.current?.focus?.()
    }
  }, [cartOpen])

  // Keyboard navigation: ↑/↓, PageUp/PageDown, Home/End and Space jump beat-to-beat
  // through the scroll-scrubbed take (the audit flagged zero keyboard control). Uses
  // seek() so it honours reduced motion (instant) vs. the smooth glide otherwise.
  useEffect(() => {
    const onKeyNav = (e: KeyboardEvent) => {
      if (cartOpen) return // the cart owns the keyboard while open
      const ae = document.activeElement as HTMLElement | null
      const tag = ae?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || ae?.isContentEditable) return
      const peaks = peakRef.current
      if (peaks.length === 0) return
      const max = document.documentElement.scrollHeight - window.innerHeight
      const cur = max > 0 ? window.scrollY / max : 0
      const EPS = 0.004
      const next = () => peaks.find((p) => p > cur + EPS) ?? peaks[peaks.length - 1]
      const prev = () => [...peaks].reverse().find((p) => p < cur - EPS) ?? peaks[0]
      let target: number | null = null
      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
          target = next()
          break
        case 'ArrowUp':
        case 'PageUp':
          target = prev()
          break
        case 'Home':
          target = peaks[0]
          break
        case 'End':
          target = peaks[peaks.length - 1]
          break
        case ' ':
          // Space activates a focused control — only hijack it for nav otherwise.
          if (tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY') return
          target = e.shiftKey ? prev() : next()
          break
        default:
          return
      }
      if (target == null) return
      e.preventDefault()
      seek(target)
    }
    window.addEventListener('keydown', onKeyNav)
    return () => window.removeEventListener('keydown', onKeyNav)
  }, [cartOpen])

  return (
    <>
    <div ref={main} className="relative">
      <EntryGate soundCapable={soundCapable} audioErrored={audioErrored} onEnter={enterExperience} />
      <Hud ref={hud} onSeek={seek} cartCount={cart.length} onOpenCart={() => setCartOpen((o) => !o)} overLight={overLight} />

      {/* Bottom-left sound control — click the bars to mute; a volume slider slides
          out on hover or keyboard focus. Shown only once the soundtrack is playing. */}
      {audioOn && (
        <div
          onPointerEnter={() => setVolOpen(true)}
          onPointerLeave={() => setVolOpen(false)}
          className="group pointer-events-auto fixed z-40 flex items-end gap-3 pt-5 pr-8 bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-[max(1.75rem,env(safe-area-inset-left))]"
        >
          <button
            onClick={toggleMute}
            aria-pressed={!muted}
            aria-label={muted ? 'Unmute soundtrack' : 'Mute soundtrack'}
            className="flex min-h-[44px] items-end gap-[3px]"
          >
            {[6, 11, 4, 9, 5].map((h, i) => (
              <span
                key={i}
                className={`w-[2px] origin-bottom ${overLight ? 'bg-ink-ghost' : 'bg-white-ghost'} ${muted ? '' : 'eq-bar'}`}
                style={{ height: h, animationDelay: `${i * 0.12}s`, transform: muted ? 'scaleY(0.3)' : undefined }}
              />
            ))}
            <span className={`ml-2 text-[10px] tracking-[0.28em] ${overLight ? 'text-ink-ghost' : 'text-white-ghost'}`}>{muted ? 'SOUND OFF' : 'SOUND'}</span>
          </button>
          <div className={`mb-[5px] flex items-center overflow-hidden transition-all duration-300 ease-out group-focus-within:opacity-100 group-focus-within:[width:6.5rem] ${volOpen ? 'opacity-100 [width:6.5rem]' : 'opacity-0 [width:0]'}`}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={volume}
              onChange={(e) => setVol(+e.target.value)}
              aria-label="Volume"
              className="vol-slider w-[6.5rem]"
            />
          </div>
        </div>
      )}

      {/* Dev-only woofer tuner (localhost). Never ships — gated on NODE_ENV. */}
      {process.env.NODE_ENV !== 'production' && audioOn && <AudioTuner />}
      {process.env.NODE_ENV !== 'production' && <RadiusTuner />}

      {/* Cart drawer — floating panel on the right with the added line items */}
      <div
        className={`fixed inset-0 z-[60] transition-opacity duration-300 ${
          cartOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!cartOpen}
        inert={!cartOpen}
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
        <aside
          ref={cartPanelRef}
          aria-label="Shopping cart"
          className={`absolute right-0 top-0 flex h-full w-[min(24rem,92vw)] flex-col border-l border-white/10 bg-surface-deep transition-transform duration-500 ease-out ${
            cartOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-7 py-6">
            <span className="text-[11px] uppercase tracking-[0.28em] text-white">Your cart</span>
            <button
              onClick={() => setCartOpen(false)}
              aria-label="Close cart"
              className="-mr-2 flex h-11 w-11 cursor-pointer items-center justify-center text-lg leading-none text-white-muted transition-colors hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-7 py-6">
            {cart.length === 0 ? (
              <p className="text-[13px] font-light text-white-muted">Your cart is empty.</p>
            ) : (
              <ul className="flex flex-col gap-6">
                {cart.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-4">
                    <div>
                      <div className={`${display} text-lg uppercase leading-none text-white`}>Phantom</div>
                      <div className="mt-1.5 text-[10px] uppercase tracking-[0.2em] text-white-muted">
                        {item.label}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-light text-white">{item.price}</span>
                      <button
                        onClick={() => setCart((c) => c.filter((x) => x.id !== item.id))}
                        aria-label="Remove item"
                        className="-my-2 -mr-2 flex h-11 w-11 cursor-pointer items-center justify-center text-white-ghost transition-colors hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-white/10 px-7 py-6">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white-muted">
              <span>Subtotal</span>
              <span className="text-white">€{(cart.length * 2990).toLocaleString('en-US')}</span>
            </div>
            <button
              disabled={cart.length === 0}
              className="mt-5 w-full cursor-pointer bg-white px-6 py-3.5 text-[11px] uppercase tracking-[0.2em] text-void transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Checkout
            </button>
            <p className="mt-3 text-center text-[10px] tracking-[0.15em] text-white-ghost">
              Checkout disabled · concept
            </p>
          </div>
        </aside>
      </div>
      <div className="fixed inset-0 z-0">
        {/* Hero wordmark BEHIND the canvas: the opaque speaker occludes its middle,
            so PHANTOM reads as sitting in 3D space behind the product. */}
        <div
          ref={heroWrap}
          className="pointer-events-none absolute inset-0 flex items-start justify-center pt-[11vh]"
        >
          <h1
            ref={heroWord}
            className={`${display} text-[12vw] leading-none tracking-[0.16em] text-white/90 [text-shadow:0_4px_40px_rgba(0,0,0,0.6)] will-change-transform md:tracking-[0.32em]`}
          >
            PHANTOM
          </h1>
        </div>
        {/* Mount the WebGL canvas only once support is confirmed, so an
            unsupported browser never gets a dead black canvas. The boundary
            catches a context-init failure even on a "supported" browser. */}
        {webgl === true && (
          <CanvasErrorBoundary>
            <Canvas
              className="absolute inset-0"
              role="img"
              aria-label="3D render of the Devialet Phantom speaker"
              camera={{ fov: 35, position: [5.3, 2.8, 9.6] }}
              dpr={[1, 2]}
              // MSAA off — the composer handles AA (multisampling); tone mapping is
              // moved into the composer so the renderer must not also apply it.
              gl={{ alpha: true, antialias: false, stencil: false, toneMapping: THREE.NoToneMapping }}
              onCreated={({ gl }) => {
                // A lost GL context (GPU reset, mobile Safari backgrounding, low
                // memory) otherwise freezes on a dead frame. preventDefault lets the
                // browser try to restore; if it doesn't come back, surface the
                // reload poster instead of a stuck image.
                const canvas = gl.domElement
                let live = true
                canvas.addEventListener('webglcontextlost', (e) => {
                  e.preventDefault()
                  live = false
                  setTimeout(() => {
                    if (!live) setSceneError(true)
                  }, 1500)
                })
                canvas.addEventListener('webglcontextrestored', () => {
                  live = true
                })
              }}
            >
              <Suspense fallback={null}>
                <SceneErrorCatcher onError={() => setSceneError(true)}>
                  <Phantom finish={finish} />
                  <Studio finish={finish} />
                </SceneErrorCatcher>
              </Suspense>
              <CameraRig />
              <Effects finish={finish} />
            </Canvas>
          </CanvasErrorBoundary>
        )}
      </div>
      {/* Failure posters (replace the old silent-black). Unsupported → the WebGL
          notice; a scene throw (e.g. GLB 404) → the reload poster. Both sit above
          the preloader so a stuck loader can't hide them. */}
      {webgl === false && <SceneFallback variant="unsupported" />}
      {sceneError && <SceneFallback variant="error" />}

      {/* Text layer — a FIXED overlay; the timeline fades each beat in/out. The
          page's scroll height comes from the spacer below, not from these blocks,
          so copy and camera are choreographed independently. Positioning wrappers
          handle centring; the inner refs are what GSAP transforms (no clash). */}
      <div ref={overlayRef} className="pointer-events-none fixed inset-0 z-10 [text-shadow:0_2px_24px_rgba(0,0,0,0.5)]">
        {/* Beat 0 — hero tagline + scroll cue */}
        <div ref={setBeat(0)} className="absolute inset-0">
          <p className="absolute left-1/2 top-[75%] -translate-x-1/2 text-xs uppercase tracking-[0.35em] text-white-muted">
            The loudest. The clearest.
          </p>
          <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.4em] text-white-ghost">Scroll</span>
            <span className="scroll-line">
              <span className="scroll-line-fill" />
            </span>
          </div>
        </div>

        {/* Beat 1 — the shape (mobile: bottom · desktop: left) */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-center px-6 pb-[max(5rem,env(safe-area-inset-bottom))] md:right-auto md:left-[8vw] md:top-0 md:items-center md:justify-start md:px-0 md:pb-0">
          <div ref={setBeat(1)} className="w-full max-w-md text-center md:max-w-sm md:text-left">
            <h2 className={`${display} beat-heading text-balance text-4xl uppercase leading-none text-white md:text-5xl`}>
              No straight lines.
            </h2>
            <p className="mx-auto mt-5 max-w-xs font-light leading-relaxed text-white-muted md:mx-0">
              One continuous surface, pressurised like an aircraft fuselage. The form isn&apos;t
              styling. It&apos;s physics.
            </p>
          </div>
        </div>

        {/* Beat 2 — the power (mobile: bottom · desktop: right) */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-center px-6 pb-[max(5rem,env(safe-area-inset-bottom))] md:left-auto md:right-[8vw] md:top-0 md:items-center md:justify-end md:px-0 md:pb-0">
          <div ref={setBeat(2)} className="w-full max-w-md text-center md:max-w-sm md:text-right">
            <h2 className={`${display} beat-heading text-6xl leading-none text-white md:text-7xl lg:text-8xl`}>
              108 dB
            </h2>
            <p className="mx-auto mt-5 max-w-xs font-light leading-relaxed text-white-muted md:ml-auto md:mr-0">
              1100 watts of physical impact, from a body you can hold in two hands.
            </p>
          </div>
        </div>

        {/* Beat 3 — the detail (mobile: bottom · desktop: left) */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-center px-6 pb-[max(5rem,env(safe-area-inset-bottom))] md:right-auto md:left-[8vw] md:top-0 md:items-center md:justify-start md:px-0 md:pb-0">
          <div ref={setBeat(3)} className="w-full max-w-md text-center md:max-w-sm md:text-left">
            <h2 className={`${display} beat-heading text-balance text-4xl uppercase leading-none text-white md:text-5xl`}>
              Engineered to the millimetre.
            </h2>
            <p className="mx-auto mt-5 max-w-xs font-light leading-relaxed text-white-muted md:mx-0">
              Every grille opening, every curve of the tweeter, machined for sound, not show.
            </p>
          </div>
        </div>

        {/* Beat 4 — the spine / rear fins (mobile: bottom · desktop: right) */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-center px-6 pb-[max(5rem,env(safe-area-inset-bottom))] md:left-auto md:right-[8vw] md:top-0 md:items-center md:justify-end md:px-0 md:pb-0">
          <div ref={setBeat(4)} className="w-full max-w-md text-center md:max-w-sm md:text-right">
            <h2 className={`${display} beat-heading text-balance text-4xl uppercase leading-none text-white md:text-5xl`}>
              Heat, silenced.
            </h2>
            <p className="mx-auto mt-5 max-w-xs font-light leading-relaxed text-white-muted md:ml-auto md:mr-0">
              The spine draws 1100 watts of heat out through machined fins. No vents, no fans, no
              hum.
            </p>
          </div>
        </div>

        {/* Beat 5 — the finish (mobile: bottom · desktop: top; speaker sits between) */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-[max(5rem,env(safe-area-inset-bottom))] md:bottom-auto md:top-[8vh] md:px-0 md:pb-0">
          <div ref={setBeat(5)} className="flex flex-col items-center text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white-ghost">Drag to explore</p>
            <h2 className={`${display} beat-heading mt-3 text-balance text-4xl uppercase leading-none text-white md:text-5xl`}>
              Choose your finish.
            </h2>
            <div className="pointer-events-auto mt-8 flex flex-wrap justify-center gap-3">
              {FINISH_META.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFinish(f.id)}
                  aria-pressed={finish === f.id}
                  className={`flex min-h-[44px] cursor-pointer items-center gap-2 border px-4 py-3 text-[10px] uppercase tracking-[0.15em] transition-colors ${
                    finish === f.id
                      ? 'border-chrome-bright text-white'
                      : 'border-white/10 text-white-ghost hover:border-white/30 hover:text-white-muted'
                  }`}
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: f.dot }}
                  />
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Scroll spacer — gives the page its height so the timeline has room to
          play. The film now ends at the finish beat (one fewer beat), so the
          spacer is shorter to keep the per-beat pacing. Everything visible is
          fixed; this empty column is the scrollbar. */}
      <div aria-hidden className="h-[720vh]" />
    </div>

      {/* ── Post-film body ──────────────────────────────────────────────────
          Siblings of `main`. The fixed canvas (z-0) holds the finish frame; the
          dark sections (z-20, opaque bg-void) scroll up over it. The two editorial
          beats continue the film's voice, then the LIGHT retail interlude breaks
          the black, then the 3D REAPPEARS for the acquire/buy moment, then the
          dark close. PostTake.tsx holds the stateless content sections; the acquire
          reveal stays here because it needs the cart/finish state + the camera. */}

      {/* ACT II — editorial (dark) */}
      <Sound />
      <Presence />

      {/* ACT III — light retail interlude (paper). Wrapped so one ScrollTrigger can
          flip the HUD to dark ink while this block is under the top bar. */}
      <div ref={lightRef}>
        <Connectivity />
        <FindYourSound />
      </div>

      {/* ACT IV — ACQUIRE: the 3D reappears. Transparent section — the fixed canvas
          shows the speaker through it while the acquire ScrollTrigger blends the
          camera to the buy framing (view.acquire 0→1). The sticky inner pins the
          buying panel centre-screen for an interaction window; its wrapper is
          pointer-events-none so drag-to-rotate still reaches the canvas on the left,
          and only the panel captures clicks. */}
      <section ref={acquireRef} className="relative z-20 h-[200vh]">
        <div className="pointer-events-none sticky top-0 flex h-screen items-end px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:items-center md:px-0 md:pb-0">
          <div className="pointer-events-auto ml-auto w-full max-w-md md:mr-[8vw] md:w-[min(24rem,40vw)]">
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-[0.42em] text-white-ghost">Acquire</p>
              <h2 className={`${display} mt-4 text-5xl uppercase leading-none text-white md:text-6xl`}>
                Phantom
              </h2>
              <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-white-muted">
                {selected.label}
              </p>
              <p className="mt-4 text-2xl font-light tracking-wide text-white">{PRICE}</p>

              <div className="mt-7 border-b border-white/10">
                {[
                  {
                    q: 'Specifications',
                    a: '108 dB SPL · 1100 W · 14 Hz–27 kHz · ADH® hybrid amplification · Wi-Fi, Bluetooth, AirPlay 2, optical & USB-C.',
                  },
                  {
                    q: 'In the box',
                    a: 'Phantom I speaker · power cable · quick-start guide · 2-year warranty.',
                  },
                ].map((row) => (
                  <details key={row.q} className="group border-t border-white/10 py-3">
                    <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white [&::-webkit-details-marker]:hidden">
                      <span>{row.q}</span>
                      <span className="text-base leading-none text-white-muted transition-transform duration-300 group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 text-[13px] font-light leading-relaxed text-white-muted">{row.a}</p>
                  </details>
                ))}
                {/* Materials — carries the finish picker so colour can be changed
                    right here, without scrolling back up to the finish section. */}
                <details className="group border-t border-white/10 py-3" open>
                  <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white [&::-webkit-details-marker]:hidden">
                    <span>Finish · {selected.label}</span>
                    <span className="text-base leading-none text-white-muted transition-transform duration-300 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-[13px] font-light leading-relaxed text-white-muted">
                    Aluminium core, pressurised composite shell, machined chrome woofer rings.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {FINISH_META.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFinish(f.id)}
                        aria-pressed={finish === f.id}
                        className={`flex min-h-[44px] cursor-pointer items-center gap-2 border px-3 py-2 text-[9px] uppercase tracking-[0.15em] transition-colors ${
                          finish === f.id
                            ? 'border-chrome-bright text-white'
                            : 'border-white/10 text-white-muted hover:border-white/30 hover:text-white'
                        }`}
                      >
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: f.dot }}
                        />
                        {f.label}
                      </button>
                    ))}
                  </div>
                </details>
              </div>

              <div className="mt-7 flex flex-col gap-3">
                <button
                  onClick={addToCart}
                  className="cursor-pointer bg-white px-6 py-3.5 text-[11px] uppercase tracking-[0.2em] text-void transition-opacity hover:opacity-80"
                >
                  Add to cart
                </button>
                <button
                  onClick={() => {
                    addToCart()
                    setCartOpen(true)
                  }}
                  className="cursor-pointer border border-white/25 px-6 py-3.5 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:border-white"
                >
                  Buy now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ACT V — close (dark). Assurances sits directly below the order/acquire
          section (now dark: black + grey tiles), then the pro band + newsletter. */}
      <Assurances />
      <Professionals />
      <Newsletter />
      <SiteFooter onBackToTop={() => seek(0)} audioOn={audioOn} musicCredit={AUDIO_CREDIT} />
    </>
  )
}

useGLTF.preload(FINISH_URL.gold)
useGLTF.preload(FINISH_URL.rosegold)
useGLTF.preload(FINISH_URL['matte-black'])
