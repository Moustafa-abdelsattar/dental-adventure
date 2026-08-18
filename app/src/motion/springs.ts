import type { TargetAndTransition, Transition } from 'motion/react'

/**
 * The single source of motion truth. Nothing in the game should invent its own
 * numbers — reach for a token here so the whole product moves with one hand.
 *
 * Mapping: buttons and tool drags → snappy · cards and modals → soft ·
 * rewards → playful · badges landing → bouncy.
 */
export const springs = {
  soft: { type: 'spring', stiffness: 180, damping: 20 },
  playful: { type: 'spring', stiffness: 350, damping: 16 },
  snappy: { type: 'spring', stiffness: 500, damping: 28 },
  /** A badge arriving: overshoots further than playful, settles faster. */
  bouncy: { type: 'spring', stiffness: 420, damping: 14 },
} as const

export type SpringToken = keyof typeof springs

/** The same curves without `type`, for useSpring/useTransform which reject it. */
export const springValues = {
  soft: { stiffness: 180, damping: 20 },
  playful: { stiffness: 350, damping: 16 },
  snappy: { stiffness: 500, damping: 28 },
  bouncy: { stiffness: 420, damping: 14 },
} as const

/**
 * Idle loops. Nothing here holds perfectly still, and the rate says what a
 * thing wants: `breathe` is a tappable waiting to be found, `urge` is that
 * same thing once the child has stalled, `sway` and `drift` are scenery that
 * should never pull the eye.
 */
export const loops: Record<'breathe' | 'urge' | 'sway' | 'drift', Transition> = {
  breathe: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  urge: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' },
  sway: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' },
  drift: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
}

/**
 * A wrong tap. There are no failure states in this game, so the only answer
 * to a mistake is a gentle shake — never a red mark, never a buzz.
 */
export const wiggle: TargetAndTransition = { x: [0, -6, 6, -4, 0] }
export const wiggleTiming: Transition = { duration: 0.4 }

/**
 * One screen handing over to the next: the outgoing screen sinks back and
 * fades, the incoming one rises into its place. They overlap, so the stage is
 * never briefly empty.
 */
export const screenChange = {
  enter: { opacity: 0, y: 24 },
  settled: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
  timing: { duration: 0.28, ease: 'easeOut' } as Transition,
  /** Seconds the incoming screen starts before the outgoing one has left. */
  overlap: 0.06,
  /**
   * Seconds the stage refuses taps while one screen hands over to the next.
   *
   * A child presses twice. The first press finishes the module; the second
   * arrives a moment later, by which time the screen it was aimed at has gone
   * and the next one is sliding into that exact spot — so the stray tap lands
   * on whatever the new screen put there. Long enough to cover the crossing,
   * short enough that nobody deliberate ever notices it.
   */
  lock: 0.4,
}

/** How far apart siblings enter, so a row arrives as a run rather than a wall. */
export const STAGGER = 0.12

/**
 * Secondary motion. A child element never moves with its parent — it follows.
 * `MOTION_SPEC.md` §0.5 puts the lag at 60–100ms; these are the two the client's
 * own file specifies: the chair's headrest at 80ms, the light's arm joints at
 * 90ms apart with the distal joint last.
 */
export const SECONDARY_LAG = 0.08
export const JOINT_STAGGER = 0.09

/**
 * The clinic beats, taken from the `p:timing` XML of the client's PowerPoint
 * and recorded in `MOTION_SPEC.md` §1. These are the client's literal intent,
 * so they live here as one shared set rather than being re-typed per screen.
 *
 * The one deliberate departure: the source rotates ±2°, which is invisible on
 * a phone. `MOTION_SPEC.md` amplifies it to ±7° while preserving the five-beat
 * rhythm — hit, hold, and three decreasing swings back to rest.
 */
export const TEETER_DEG = 7

/**
 * Chair and light teeter to the same shape at different speeds, so the shape is
 * expressed once in normalised time and the duration says which object it is.
 * Beats: rise by 100/180ms, hold to 200/360ms, then swing at even intervals.
 */
export const teeter = {
  keyframes: [0, TEETER_DEG, TEETER_DEG, -TEETER_DEG, TEETER_DEG, -TEETER_DEG, 0],
  times: [0, 0.1, 0.2, 0.4, 0.6, 0.8, 1],
} as const

/** Seconds for one full teeter. The client used a slower one for the light. */
export const TEETER_S = { chair: 1.0, light: 1.8 } as const

/** The chair reclining once the teeter has settled: 14° about its hinge. */
export const recline = {
  degrees: 14,
  transition: { type: 'spring', stiffness: 160, damping: 24 } as Transition,
  /** Seconds after the teeter finishes before the recline starts. */
  delay: 0.09,
}

/**
 * The light coming on: 0 → 1 over 400ms with a 60ms flicker at 120ms. The dip
 * is what makes it read as a real fluorescent striking rather than a fade.
 */
export const lightWarmUp = {
  keyframes: [0, 0.55, 0.15, 0.7, 1],
  times: [0, 0.3, 0.375, 0.45, 1],
  transition: { duration: 0.4, ease: 'easeOut' } as Transition,
}

/**
 * Trolley pulse — `presetID="6"` grow/shrink over 2000ms. Deliberately not a
 * symmetric ease: it reaches peak at 40%, holds for 10%, and takes the whole
 * back half to return, which is what gives it weight.
 */
export const pulse = {
  keyframes: [1, 1.14, 1.14, 1],
  times: [0, 0.4, 0.5, 1],
  transition: { duration: 2, ease: 'easeInOut' } as Transition,
}
