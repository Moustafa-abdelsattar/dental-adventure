import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Sparkle } from './Sparkle'

/**
 * The large friendly tooth used by the practice modules — the owner's
 * custom clay-render tooth art (happy / sleepy variants with baked faces),
 * with plaque spots and care-tool overlays (ring / umbrella / sparkles).
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
  // on the crown edges, clear of the face
  const spotPos = [
    { cx: 42, cy: 64 },
    { cx: 160, cy: 58 },
    { cx: 56, cy: 148 },
    { cx: 148, cy: 152 },
  ]

  // brief foam burst wherever a spot was just cleaned
  const prevSpots = useRef(spots)
  const [foams, setFoams] = useState<{ key: number; cx: number; cy: number }[]>([])
  useEffect(() => {
    spots.forEach((dirty, i) => {
      if (!dirty && prevSpots.current[i]) {
        const key = performance.now() + i
        setFoams(f => [...f, { key, cx: spotPos[i].cx, cy: spotPos[i].cy }])
        setTimeout(() => setFoams(f => f.filter(x => x.key !== key)), 750)
      }
    })
    prevSpots.current = spots
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spots])

  return (
    <div className="relative w-full max-w-xs mx-auto aspect-square" data-testid="big-tooth">
      {showUmbrella && (
        <motion.img
          data-testid="tooth-umbrella"
          src="/art/tool-umbrella.webp"
          alt=""
          draggable={false}
          className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[64%] z-10 pointer-events-none select-none drop-shadow"
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
        <img
          src={sleepy ? '/art/tooth-sleepy.webp' : '/art/tooth-happy.webp'}
          alt=""
          draggable={false}
          className="w-full h-full object-contain select-none drop-shadow-lg"
        />

        {/* plaque + sparkles overlay */}
        <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
          {spotPos.map((p, i) =>
            spots[i] ? (
              <motion.g
                key={i}
                data-testid={`plaque-${i}`}
                onClick={e => {
                  e.stopPropagation()
                  onSpotTap?.(i)
                }}
                onPointerEnter={e => {
                  if (e.buttons > 0) onSpotTap?.(i)
                }}
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              >
                <path
                  d={`M${p.cx - 13} ${p.cy} Q${p.cx - 11} ${p.cy - 12} ${p.cx} ${p.cy - 12} Q${p.cx + 12} ${p.cy - 11} ${p.cx + 13} ${p.cy + 1} Q${p.cx + 11} ${p.cy + 12} ${p.cx - 1} ${p.cy + 12} Q${p.cx - 12} ${p.cy + 10} ${p.cx - 13} ${p.cy} Z`}
                  fill="#e3d17e"
                  stroke="#b9a353"
                  strokeWidth="2.5"
                />
                <circle cx={p.cx - 4} cy={p.cy - 3} r="2.2" fill="#c4ad5c" />
                <circle cx={p.cx + 4} cy={p.cy + 3} r="1.8" fill="#c4ad5c" />
              </motion.g>
            ) : null,
          )}

          {foams.map(f => (
            <g key={f.key} data-testid="foam">
              {[
                { dx: 0, dy: 0, r: 11 },
                { dx: -11, dy: -7, r: 7 },
                { dx: 10, dy: -9, r: 6 },
                { dx: 7, dy: 9, r: 7 },
                { dx: -9, dy: 8, r: 5 },
              ].map((b, j) => (
                <motion.circle
                  key={j}
                  cx={f.cx + b.dx}
                  cy={f.cy + b.dy}
                  fill="#ffffff"
                  stroke="#dfe7f5"
                  strokeWidth="1.5"
                  initial={{ r: 0, opacity: 0.95 }}
                  animate={{ r: b.r * 1.25, opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut', delay: j * 0.04 }}
                />
              ))}
              <Sparkle x={f.cx} y={f.cy - 16} size={6} />
            </g>
          ))}

          {sparkle && (
            <g data-testid="tooth-sparkle">
              <Sparkle x={44} y={44} />
              <Sparkle x={158} y={58} delay={0.3} />
              <Sparkle x={100} y={166} delay={0.6} />
            </g>
          )}
        </svg>
      </motion.div>

      {showRing && (
        <motion.img
          data-testid="tooth-ring"
          src="/art/tool-ring.webp"
          alt=""
          draggable={false}
          className="absolute inset-0 m-auto w-[92%] z-10 pointer-events-none select-none opacity-90"
          initial={{ scale: 1.25, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.9 }}
        />
      )}
    </div>
  )
}
