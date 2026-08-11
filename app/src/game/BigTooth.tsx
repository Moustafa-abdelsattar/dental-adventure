import { motion } from 'motion/react'
import { toolPalette as P } from './tools/palette'
import { Sparkle } from './Sparkle'

/**
 * The large friendly tooth used by the practice modules — the Fluent 3D
 * tooth asset with an animated face, plaque spots, and care-tool overlays
 * (ring / umbrella / sparkles) drawn on top.
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
    { cx: 64, cy: 76 },
    { cx: 136, cy: 68 },
    { cx: 84, cy: 128 },
    { cx: 122, cy: 140 },
  ]
  return (
    <div className="relative w-full max-w-xs mx-auto aspect-[200/220]" data-testid="big-tooth">
      {showUmbrella && (
        <motion.img
          data-testid="tooth-umbrella"
          src="/art/tool-umbrella.png"
          alt=""
          draggable={false}
          className="absolute -top-[16%] start-1/2 -translate-x-1/2 w-[62%] z-10 pointer-events-none select-none drop-shadow"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0, rotate: [-3, 3, -3] }}
          transition={{ rotate: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } }}
        />
      )}

      <motion.div
        className="absolute inset-0"
        onClick={onBodyTap}
        animate={sleepy ? { y: [0, 3, 0] } : { y: [0, -4, 0] }}
        transition={{ duration: sleepy ? 3 : 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img src="/art/tooth.png" alt="" draggable={false} className="w-full h-full object-contain select-none drop-shadow-lg" />

        {/* face + plaque + sparkles overlay */}
        <svg viewBox="0 0 200 220" className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
          {sleepy ? (
            <>
              <path d="M68 96 q7 8 14 0" stroke={P.outline} strokeWidth="4.5" fill="none" strokeLinecap="round" />
              <path d="M118 96 q7 8 14 0" stroke={P.outline} strokeWidth="4.5" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="75" cy="94" rx="7" ry="9" fill={P.outline} />
              <ellipse cx="125" cy="94" rx="7" ry="9" fill={P.outline} />
              <circle cx="77.5" cy="90" r="2.4" fill="#ffffff" />
              <circle cx="127.5" cy="90" r="2.4" fill="#ffffff" />
            </>
          )}
          <path d="M86 116 q14 12 28 0" stroke={P.outline} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <circle cx="58" cy="110" r="7" fill={P.grip} opacity="0.6" />
          <circle cx="142" cy="110" r="7" fill={P.grip} opacity="0.6" />

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
                onClick={e => {
                  e.stopPropagation()
                  onSpotTap?.(i)
                }}
                onPointerEnter={e => {
                  if (e.buttons > 0) onSpotTap?.(i)
                }}
                animate={{ opacity: [0.75, 0.95, 0.75] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              />
            ) : null,
          )}

          {sparkle && (
            <g data-testid="tooth-sparkle">
              <Sparkle x={54} y={54} />
              <Sparkle x={148} y={66} delay={0.3} />
              <Sparkle x={100} y={160} delay={0.6} />
            </g>
          )}
        </svg>
      </motion.div>

      {showRing && (
        <motion.img
          data-testid="tooth-ring"
          src="/art/tool-ring.png"
          alt=""
          draggable={false}
          className="absolute inset-x-0 top-[14%] mx-auto w-[96%] z-10 pointer-events-none select-none opacity-90"
          initial={{ scale: 1.25, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.9 }}
        />
      )}
    </div>
  )
}
