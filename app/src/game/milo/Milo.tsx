import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { springs } from '../../lib/springs'
import { audio } from '../../lib/audio'

export type MiloPose = 'idle' | 'wave' | 'point' | 'happy' | 'celebrate'

const armAnim: Record<MiloPose, { rotate: number | number[] }> = {
  idle: { rotate: 0 },
  wave: { rotate: [0, -50, -10, -50, 0] },
  point: { rotate: -70 },
  happy: { rotate: -15 },
  celebrate: { rotate: [-160, -140, -160] },
}

/**
 * Milo the Tooth — layered SVG mascot.
 * Blinks on his own, flaps his mouth while narration plays,
 * and tapping him replays the last spoken line.
 */
export function Milo({ pose = 'idle', size = 180 }: { pose?: MiloPose; size?: number }) {
  const [blink, setBlink] = useState(false)
  const [talking, setTalking] = useState(false)

  useEffect(() => audio.onTalkingChange(setTalking), [])

  useEffect(() => {
    let alive = true
    let timer: ReturnType<typeof setTimeout>
    const loop = () => {
      timer = setTimeout(() => {
        if (!alive) return
        setBlink(true)
        setTimeout(() => alive && setBlink(false), 140)
        loop()
      }, 3000 + Math.random() * 2000)
    }
    loop()
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [])

  const bigSmile = pose === 'happy' || pose === 'celebrate'

  return (
    <motion.svg
      viewBox="0 0 200 220"
      width={size}
      height={size * 1.1}
      onClick={() => void audio.replayLast()}
      animate={pose === 'celebrate' ? { y: [0, -16, 0, -10, 0] } : { y: [0, -6, 0] }}
      transition={
        pose === 'celebrate'
          ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
      }
      style={{ cursor: 'pointer', overflow: 'visible' }}
      role="img"
      aria-label="Milo the Tooth"
    >
      <ellipse id="milo-shadow" cx="100" cy="212" rx="52" ry="8" fill="#00000014" />

      {/* arms behind the body */}
      <motion.g id="milo-arm-l" style={{ originX: '40px', originY: '112px' }}>
        <path d="M42 112 Q16 124 24 144" stroke="#e8eefb" strokeWidth="12" strokeLinecap="round" fill="none" />
      </motion.g>
      <motion.g
        id="milo-arm-r"
        animate={armAnim[pose]}
        transition={pose === 'wave' ? { duration: 1.2, ease: 'easeInOut' } : springs.soft}
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
      <ellipse id="milo-eye-l" cx="76" cy="82" rx="9" ry={blink ? 1.5 : 12} fill="#3a3560" />
      <ellipse id="milo-eye-r" cx="124" cy="82" rx="9" ry={blink ? 1.5 : 12} fill="#3a3560" />
      {!blink && (
        <>
          <circle cx="79" cy="77" r="3" fill="#ffffff" />
          <circle cx="127" cy="77" r="3" fill="#ffffff" />
        </>
      )}
      <g id="milo-cheeks">
        <circle cx="58" cy="102" r="9" fill="#f9a8c5" opacity="0.7" />
        <circle cx="142" cy="102" r="9" fill="#f9a8c5" opacity="0.7" />
      </g>

      {talking ? (
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
}
