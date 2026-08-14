import { motion, type TargetAndTransition } from 'motion/react'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { springs, loops } from '../../motion/springs'
import { audio } from '../../lib/audio'

/**
 * The seven states Milo can be in. `blink` and `talk` normally drive
 * themselves — he blinks on his own timer and his mouth follows whatever
 * narration is playing — but both can be forced through the ref API.
 */
export type MiloState = 'idle' | 'blink' | 'talk' | 'wave' | 'point' | 'happy' | 'celebrate'

/** Older name for the same thing, kept so callers reading as "pose" still work. */
export type MiloPose = MiloState

export interface MiloHandle {
  /** Play a state. Transient ones fall back to idle on their own. */
  trigger(state: MiloState): void
  /** Force the talking mouth on or off, independent of narration. */
  setTalking(on: boolean): void
}

/** How long a triggered state holds before falling back to idle. 0 = holds. */
const HOLD_MS: Record<MiloState, number> = {
  idle: 0,
  blink: 140,
  talk: 0,
  wave: 1200,
  point: 0,
  happy: 1200,
  celebrate: 1400,
}

// Arms hang from the shoulders; the left mirrors the right, so a positive
// rotation raises it and a negative one raises the right.
const ARM_L: Record<MiloState, TargetAndTransition> = {
  idle: { rotate: 0 },
  blink: { rotate: 0 },
  talk: { rotate: 0 },
  wave: { rotate: 0 },
  point: { rotate: 0 },
  happy: { rotate: 15 },
  celebrate: { rotate: [160, 140, 160] },
}

const ARM_R: Record<MiloState, TargetAndTransition> = {
  idle: { rotate: 0 },
  blink: { rotate: 0 },
  talk: { rotate: 0 },
  wave: { rotate: [0, -50, -10, -50, 0] },
  point: { rotate: -70 },
  happy: { rotate: -15 },
  celebrate: { rotate: [-160, -140, -160] },
}

// Eyebrows carry most of the read at small sizes — at 32px in the HUD the
// mouth is a few pixels, but a raised brow still says "pleased" clearly.
const BROW: Record<MiloState, TargetAndTransition> = {
  idle: { y: 0, rotate: 0 },
  blink: { y: 1, rotate: 0 },
  talk: { y: -1, rotate: 0 },
  wave: { y: -3, rotate: 0 },
  point: { y: -2, rotate: -5 },
  happy: { y: -4, rotate: 0 },
  celebrate: { y: -5, rotate: 0 },
}

/**
 * Milo the Tooth — layered SVG mascot: shadow, arms, body, cape, eyes,
 * eyebrows, cheeks and mouth, each its own addressable layer so the rig can be
 * ported to Rive later behind this same interface without callers changing.
 *
 * He blinks on his own, flaps his mouth in time with the baked narration, and
 * replays the last spoken line when tapped.
 */
export const Milo = forwardRef<MiloHandle, { pose?: MiloState; size?: number }>(function Milo(
  { pose = 'idle', size = 180 },
  ref,
) {
  const [state, setState] = useState<MiloState>(pose)
  const [blinking, setBlinking] = useState(false)
  const [talking, setTalking] = useState(false)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // the declarative prop and the imperative trigger drive the same state
  useEffect(() => setState(pose), [pose])

  useImperativeHandle(ref, () => ({
    trigger(next: MiloState) {
      clearTimeout(holdTimer.current)
      if (next === 'blink') {
        setBlinking(true)
        holdTimer.current = setTimeout(() => setBlinking(false), HOLD_MS.blink)
        return
      }
      setState(next)
      if (HOLD_MS[next] > 0) holdTimer.current = setTimeout(() => setState('idle'), HOLD_MS[next])
    },
    setTalking,
  }))

  useEffect(() => () => clearTimeout(holdTimer.current), [])

  // his mouth follows the baked clips, so the lip-sync is free
  useEffect(() => audio.onTalkingChange(setTalking), [])

  useEffect(() => {
    let alive = true
    let timer: ReturnType<typeof setTimeout>
    const loop = () => {
      timer = setTimeout(
        () => {
          if (!alive) return
          setBlinking(true)
          setTimeout(() => alive && setBlinking(false), HOLD_MS.blink)
          loop()
        },
        3000 + Math.random() * 2000,
      )
    }
    loop()
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [])

  const bigSmile = state === 'happy' || state === 'celebrate'
  const shut = blinking || state === 'blink'

  return (
    <motion.svg
      viewBox="0 0 200 220"
      width={size}
      height={size * 1.1}
      onClick={() => void audio.replayLast()}
      animate={state === 'celebrate' ? { y: [0, -16, 0, -10, 0] } : { y: [0, -6, 0] }}
      transition={state === 'celebrate' ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } : loops.drift}
      style={{ cursor: 'pointer', overflow: 'visible' }}
      role="img"
      aria-label="Milo the Tooth"
      data-state={state}
    >
      <ellipse id="milo-shadow" cx="100" cy="212" rx="52" ry="8" fill="#00000014" />

      {/* arms behind the body */}
      <motion.g
        id="milo-arm-l"
        animate={ARM_L[state]}
        transition={state === 'celebrate' ? loops.breathe : springs.soft}
        style={{ originX: '40px', originY: '112px' }}
      >
        <path d="M42 112 Q16 124 24 144" stroke="#e8eefb" strokeWidth="12" strokeLinecap="round" fill="none" />
      </motion.g>
      <motion.g
        id="milo-arm-r"
        animate={ARM_R[state]}
        transition={state === 'wave' ? { duration: 1.2, ease: 'easeInOut' } : state === 'celebrate' ? loops.breathe : springs.soft}
        style={{ originX: '160px', originY: '112px' }}
      >
        <path d="M158 112 Q184 124 176 144" stroke="#e8eefb" strokeWidth="12" strokeLinecap="round" fill="none" />
      </motion.g>

      {/* tooth body: crown + two root-legs */}
      <path
        id="milo-body"
        d="M100 12 C152 12 174 46 172 94 C170 134 160 162 149 187 C142 203 127 202 124 183 C121 166 112 158 100 158 C88 158 79 166 76 183 C73 202 58 203 51 187 C40 162 30 134 28 94 C26 46 48 12 100 12 Z"
        fill="#ffffff"
        stroke="#dfe7f5"
        strokeWidth="5"
      />
      {/* soft crown highlight */}
      <path d="M62 34 Q100 20 138 34 Q120 26 100 26 Q80 26 62 34 Z" fill="#f2f7ff" />

      {/* blue cape/scarf per the board */}
      <path id="milo-cape" d="M50 106 Q100 140 150 106 L143 128 Q100 154 57 128 Z" fill="#3b7fc4" />
      <path d="M50 106 Q100 140 150 106 L147 114 Q100 146 53 114 Z" fill="#4f93d8" />

      {/* face */}
      <motion.g id="milo-brow-l" animate={BROW[state]} transition={springs.soft} style={{ originX: '76px', originY: '64px' }}>
        <path d="M66 64 Q76 58 87 63" stroke="#3a3560" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      </motion.g>
      <motion.g id="milo-brow-r" animate={BROW[state]} transition={springs.soft} style={{ originX: '124px', originY: '64px' }}>
        <path d="M113 63 Q124 58 134 64" stroke="#3a3560" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      </motion.g>

      <ellipse id="milo-eye-l" cx="76" cy="82" rx="9" ry={shut ? 1.5 : 12} fill="#3a3560" />
      <ellipse id="milo-eye-r" cx="124" cy="82" rx="9" ry={shut ? 1.5 : 12} fill="#3a3560" />
      {!shut && (
        <>
          <circle cx="79" cy="77" r="3" fill="#ffffff" />
          <circle cx="127" cy="77" r="3" fill="#ffffff" />
        </>
      )}
      <g id="milo-cheeks">
        <circle cx="58" cy="102" r="9" fill="#f9a8c5" opacity="0.7" />
        <circle cx="142" cy="102" r="9" fill="#f9a8c5" opacity="0.7" />
      </g>

      {talking || state === 'talk' ? (
        <motion.ellipse
          id="milo-mouth"
          data-variant="talking"
          cx="100"
          cy="114"
          fill="#7a4a5a"
          // rx/ry must come from `initial`, not from static attributes: Motion
          // owns these once it animates them, and without a starting value it
          // writes `undefined` on its first render pass and the browser
          // rejects the attribute.
          initial={{ rx: 12, ry: 9 }}
          animate={{ ry: [6, 11, 6], rx: [10, 13, 10] }}
          transition={{ duration: 0.35, repeat: Infinity }}
        />
      ) : (
        <path
          id="milo-mouth"
          data-variant={bigSmile ? 'big' : 'smile'}
          d={bigSmile ? 'M76 106 Q100 134 124 106 Z' : 'M82 110 Q100 124 118 110'}
          fill={bigSmile ? '#7a4a5a' : 'none'}
          stroke="#3a3560"
          strokeWidth="5"
          strokeLinecap="round"
        />
      )}
    </motion.svg>
  )
})
