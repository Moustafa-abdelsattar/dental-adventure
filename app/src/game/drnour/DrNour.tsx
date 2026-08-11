import { motion } from 'motion/react'
import { springs } from '../../lib/springs'

/**
 * Dr. Nour — the owner's custom dentist art, with a coded face mask overlay.
 * Rendered masked first; tapping the mask slides it away, revealing the
 * smile underneath — teaching that the masked stranger is a smiling helper.
 */
export function DrNour({
  masked,
  onMaskTap,
  idle = true,
  size = 160,
}: {
  masked: boolean
  onMaskTap?: () => void
  idle?: boolean
  size?: number
}) {
  return (
    <motion.div
      className="relative select-none"
      style={{ width: size }}
      animate={idle ? { y: [0, -4, 0] } : {}}
      transition={{ duration: 3.5, repeat: idle ? Infinity : 0, ease: 'easeInOut' }}
      data-testid="drnour"
      role="img"
      aria-label="Dr. Nour"
    >
      <img src="/art/drnour.webp" alt="" draggable={false} className="w-full drop-shadow-md" />

      {masked ? (
          <motion.svg
            key="mask"
            data-testid="drnour-mask"
            viewBox="0 0 100 60"
            onClick={onMaskTap}
            className="absolute cursor-pointer"
            style={{ left: '27%', top: '26%', width: '34%' }}
            initial={false}
            whileTap={{ scale: 0.95 }}
            transition={springs.soft}
          >
            <path d="M22 14 Q50 6 78 14 L74 44 Q50 56 26 44 Z" fill="#cfe8f9" stroke="#7ec8f2" strokeWidth="3" />
            <path d="M28 22 Q50 17 72 22 M27 30 Q50 25 73 30 M28 38 Q50 33 72 38" stroke="#a9d5f0" strokeWidth="2" fill="none" />
            <line x1="22" y1="16" x2="6" y2="8" stroke="#7ec8f2" strokeWidth="3" strokeLinecap="round" />
            <line x1="78" y1="16" x2="94" y2="8" stroke="#7ec8f2" strokeWidth="3" strokeLinecap="round" />
          </motion.svg>
        ) : (
          <motion.svg
            key="smile"
            data-testid="drnour-smile"
            viewBox="0 0 100 60"
            className="absolute pointer-events-none"
            style={{ left: '20%', top: '18%', width: '48%' }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springs.playful}
          >
            {[
              { x: 12, y: 14, d: 0 },
              { x: 88, y: 10, d: 0.25 },
              { x: 80, y: 46, d: 0.5 },
            ].map(s => (
              <motion.path
                key={s.x}
                d={`M${s.x} ${s.y - 5} L${s.x + 1.6} ${s.y - 1.6} L${s.x + 5} ${s.y} L${s.x + 1.6} ${s.y + 1.6} L${s.x} ${s.y + 5} L${s.x - 1.6} ${s.y + 1.6} L${s.x - 5} ${s.y} L${s.x - 1.6} ${s.y - 1.6} Z`}
                fill="#ffd45e"
                animate={{ opacity: [0, 1, 0], scale: [0.6, 1.2, 0.6] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: s.d }}
              />
            ))}
          </motion.svg>
        )}
    </motion.div>
  )
}
