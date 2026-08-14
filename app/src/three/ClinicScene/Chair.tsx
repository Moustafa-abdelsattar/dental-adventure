import { useFrame } from '@react-three/fiber'
import { useRef, type Ref } from 'react'
import type { Group } from 'three'
import { Model, PIVOT } from '../Model'

/**
 * The dental chair, teetering to the client's own timing.
 *
 * The PPTX drives this with five discrete keyframes over 1000ms at ±2°. The
 * motion spec says to keep that rhythm but amplify to ±7° — ±2° is invisible
 * on a phone — and to drive it with a spring rather than keyframes, so the tap
 * feels like a nudge to a real object rather than a clip being played.
 *
 * So this is an actual damped harmonic oscillator: a tap injects angular
 * velocity and the damping resolves it. The spring constants are the spec's
 * (tension 420, friction 8, mass 1.1), which land on ~2.5 visible swings in
 * ~0.8s — the five beats, arrived at by physics instead of by hand.
 */
const TENSION = 420
const FRICTION = 8
const MASS = 1.1

const PEAK_RAD = (7 * Math.PI) / 180

/** Undamped natural frequency, rad/s. */
const OMEGA_N = Math.sqrt(TENSION / MASS)
/** Damping ratio. Under 1, so it oscillates — that is where the beats come from. */
const ZETA = FRICTION / (2 * Math.sqrt(TENSION * MASS))
/** Damped frequency: what you actually see. */
const OMEGA_D = OMEGA_N * Math.sqrt(1 - ZETA * ZETA)

/**
 * Impulse needed to reach exactly PEAK_RAD on the first swing.
 *
 * The spec suggests 9 rad/s, but at these constants that peaks near 26° —
 * roughly four times the amplitude the same paragraph asks for — so the stated
 * ±7° is the real intent and the impulse follows from it.
 *
 * Naively that would be peak × ω, but damping bleeds off a fifth of the first
 * swing before it gets there. For θ(0)=0, θ'(0)=v the response is
 * (v/ω_d)·e^(−ζω_n·t)·sin(ω_d·t), which peaks at t = φ/ω_d where
 * φ = atan(√(1−ζ²)/ζ). Solving that for v is the difference between a chair
 * that tips 5.2° and one that tips the 7° asked for.
 */
const PEAK_PHASE = Math.atan(Math.sqrt(1 - ZETA * ZETA) / ZETA)
const PEAK_PER_UNIT_VELOCITY =
  (Math.exp((-ZETA * OMEGA_N * PEAK_PHASE) / OMEGA_D) * Math.sin(PEAK_PHASE)) / OMEGA_D
export const IMPULSE = PEAK_RAD / PEAK_PER_UNIT_VELOCITY

/**
 * The teeter as pure numbers, so the physics can be checked without a GPU.
 * Same integrator as the frame loop; returns the angle in degrees over time.
 */
export function simulateTeeter(seconds = 2, step = 1 / 240) {
  let theta = 0
  let omega = IMPULSE
  const out: { t: number; deg: number }[] = []
  for (let t = 0; t < seconds; t += step) {
    const accel = (-TENSION * theta - FRICTION * omega) / MASS
    omega += accel * step
    theta += omega * step
    out.push({ t, deg: (theta * 180) / Math.PI })
  }
  return out
}

/** Below this the wobble is invisible; stop integrating and let it rest. */
const REST = 0.0004

export function Chair({
  onSettle,
  groupRef,
  ...props
}: {
  onSettle?: () => void
  groupRef?: Ref<Group>
} & Omit<React.ComponentProps<typeof Model>, 'url' | 'pivot'>) {
  const pivot = useRef<Group>(null)
  const theta = useRef(0)
  const omega = useRef(0)
  const moving = useRef(false)

  useFrame((_, delta) => {
    const g = pivot.current
    if (!g) return
    if (!moving.current) return

    // fixed sub-steps: a long frame must not blow up the integration
    let remaining = Math.min(delta, 0.1)
    while (remaining > 0) {
      const h = Math.min(remaining, 1 / 240)
      const accel = (-TENSION * theta.current - FRICTION * omega.current) / MASS
      omega.current += accel * h
      theta.current += omega.current * h
      remaining -= h
    }

    if (Math.abs(theta.current) < REST && Math.abs(omega.current) < REST) {
      theta.current = 0
      omega.current = 0
      moving.current = false
      onSettle?.()
    }

    g.rotation.z = theta.current
  })

  const nudge = () => {
    // always kick it the way it is already going, so repeated taps build rather
    // than fight — a child will tap it many times
    omega.current += theta.current >= 0 ? IMPULSE : -IMPULSE
    moving.current = true
  }

  return (
    <group ref={groupRef}>
      <group ref={pivot} name="chair-pivot">
        <Model {...props} url="/models/chair.glb" pivot={PIVOT.base} onTap={nudge} />
      </group>
    </group>
  )
}
