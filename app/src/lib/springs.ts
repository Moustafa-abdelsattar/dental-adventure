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
}

/** How far apart siblings enter, so a row arrives as a run rather than a wall. */
export const STAGGER = 0.12
