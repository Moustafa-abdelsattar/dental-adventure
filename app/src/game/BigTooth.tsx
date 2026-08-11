import { motion } from 'motion/react'
import { toolPalette as P } from './tools/palette'
import { Sparkle } from './Sparkle'

/**
 * The large friendly tooth used by the practice modules.
 * `spots` marks which of the four plaque spots are still dirty.
 */
export function BigTooth({
  spots = [false, false, false, false],
  sleepy = false,
  sparkle = false,
  showRing = false,
  showUmbrella = false,
  onSpotTap,
  onBodyTap,
}: {
  spots?: boolean[]
  sleepy?: boolean
  sparkle?: boolean
  showRing?: boolean
  showUmbrella?: boolean
  onSpotTap?: (index: number) => void
  onBodyTap?: () => void
}) {
  const spotPos = [
    { cx: 62, cy: 68 },
    { cx: 132, cy: 60 },
    { cx: 84, cy: 118 },
    { cx: 118, cy: 132 },
  ]
  return (
    <svg viewBox="0 0 200 220" className="w-full max-w-xs mx-auto" style={{ overflow: 'visible' }} data-testid="big-tooth">
      {showUmbrella && (
        <motion.g initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} data-testid="tooth-umbrella">
          <path d="M40 22 Q100 -28 160 22 Q140 10 120 22 Q110 12 100 22 Q90 12 80 22 Q60 10 40 22 Z" fill={P.accent} stroke={P.outline} strokeWidth="4" />
          <line x1="100" y1="22" x2="100" y2="40" stroke={P.metal} strokeWidth="4" strokeLinecap="round" />
        </motion.g>
      )}
      <motion.g onClick={onBodyTap} animate={sleepy ? { y: [0, 2, 0] } : {}} transition={{ duration: 3, repeat: sleepy ? Infinity : 0, ease: 'easeInOut' }}>
        <path
          d="M100 34 C148 34 168 64 166 106 C164 142 155 166 145 188 C139 202 126 201 123 185 C120 170 112 163 100 163 C88 163 80 170 77 185 C74 201 61 202 55 188 C45 166 36 142 34 106 C32 64 52 34 100 34 Z"
          fill="#ffffff"
          stroke={P.metal}
          strokeWidth="5"
        />
        {sleepy ? (
          <>
            <path d="M70 92 q6 7 12 0" stroke={P.outline} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M118 92 q6 7 12 0" stroke={P.outline} strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="76" cy="92" r="7" fill={P.outline} />
            <circle cx="124" cy="92" r="7" fill={P.outline} />
          </>
        )}
        <path d="M86 116 q14 12 28 0" stroke={P.outline} strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="60" cy="108" r="7" fill={P.grip} opacity="0.55" />
        <circle cx="140" cy="108" r="7" fill={P.grip} opacity="0.55" />
      </motion.g>

      {showRing && (
        <motion.ellipse
          data-testid="tooth-ring"
          cx="100"
          cy="120"
          rx="82"
          ry="58"
          fill="none"
          stroke={P.grip}
          strokeWidth="9"
          strokeLinecap="round"
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ originX: '100px', originY: '120px' }}
        />
      )}

      {spotPos.map((p, i) =>
        spots[i] ? (
          <motion.circle
            key={i}
            data-testid={`plaque-${i}`}
            cx={p.cx}
            cy={p.cy}
            r="13"
            fill="#d9c86a"
            stroke={P.outline}
            strokeWidth="3"
            opacity="0.9"
            onClick={() => onSpotTap?.(i)}
            onPointerEnter={e => {
              if (e.buttons > 0) onSpotTap?.(i)
            }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            style={{ cursor: 'pointer' }}
          />
        ) : null,
      )}

      {sparkle && (
        <g data-testid="tooth-sparkle">
          <Sparkle x={58} y={52} />
          <Sparkle x={146} y={64} delay={0.3} />
          <Sparkle x={100} y={150} delay={0.6} />
        </g>
      )}
    </svg>
  )
}
