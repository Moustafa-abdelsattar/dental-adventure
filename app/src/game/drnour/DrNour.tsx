import { useState } from 'react'
import { motion } from 'motion/react'
import { springs } from '../../lib/springs'

/**
 * Dr. Nour — the owner's custom dentist art with a tap-to-reveal mask.
 * Preferred: a real masked render (`/art/drnour-masked.webp`, same character
 * wearing a mask) crossfaded with the unmasked one. Until that asset exists,
 * a soft-shaded drawn mask overlay stands in.
 */
export function DrNour({
  masked,
  onMaskTap,
  idle = true,
  size,
}: {
  masked: boolean
  onMaskTap?: () => void
  idle?: boolean
  /** Fixed pixel width; omit to fill the parent. */
  size?: number
}) {
  const [hasMaskedArt, setHasMaskedArt] = useState(true)

  return (
    <motion.div
      className="relative select-none"
      style={{ width: size ?? '100%' }}
      animate={idle ? { y: [0, -4, 0] } : {}}
      transition={{ duration: 3.5, repeat: idle ? Infinity : 0, ease: 'easeInOut' }}
      data-testid="drnour"
      role="img"
      aria-label="Dr. Nour"
    >
      <img src="/art/drnour.webp" alt="" draggable={false} className="w-full drop-shadow-md" />

      {masked && hasMaskedArt && (
        <motion.img
          data-testid="drnour-mask"
          src="/art/drnour-masked.webp"
          alt=""
          draggable={false}
          onError={() => setHasMaskedArt(false)}
          onClick={onMaskTap}
          className="absolute inset-0 w-full cursor-pointer drop-shadow-md"
          whileTap={{ scale: 0.97 }}
          transition={springs.soft}
        />
      )}

      {masked && !hasMaskedArt && (
        <motion.svg
          data-testid="drnour-mask"
          viewBox="0 0 100 62"
          onClick={onMaskTap}
          className="absolute cursor-pointer"
          style={{ left: '29.5%', top: '27.5%', width: '42%' }}
          initial={false}
          whileTap={{ scale: 0.95 }}
          transition={springs.soft}
        >
          <defs>
            <linearGradient id="maskFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e8f5fd" />
              <stop offset="0.55" stopColor="#bfe0f5" />
              <stop offset="1" stopColor="#9ccbe9" />
            </linearGradient>
            <linearGradient id="maskEdge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="1" stopColor="#7ab4d8" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          {/* ear loops behind */}
          <path d="M16 22 Q4 24 8 36" stroke="#a9cfe8" strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <path d="M84 22 Q96 24 92 36" stroke="#a9cfe8" strokeWidth="3.4" fill="none" strokeLinecap="round" />
          {/* mask body shaped to nose + chin */}
          <path d="M18 20 Q50 8 82 20 Q86 34 78 48 Q64 60 50 60 Q36 60 22 48 Q14 34 18 20 Z" fill="url(#maskFill)" />
          <path d="M18 20 Q50 8 82 20 Q83 24 82 28 Q50 16 18 28 Q17 24 18 20 Z" fill="#ffffff" opacity="0.55" />
          {/* soft pleats */}
          <path d="M24 28 Q50 21 76 28" stroke="url(#maskEdge)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M23 37 Q50 30 77 37" stroke="url(#maskEdge)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M26 46 Q50 40 74 46" stroke="url(#maskEdge)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          {/* chin shadow */}
          <path d="M30 53 Q50 61 70 53 Q60 58 50 58 Q40 58 30 53 Z" fill="#6fa8cd" opacity="0.35" />
        </motion.svg>
      )}

      {!masked && (
        <motion.svg
          data-testid="drnour-smile"
          viewBox="0 0 100 60"
          className="absolute pointer-events-none"
          style={{ left: '18%', top: '20%', width: '56%' }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springs.playful}
        >
          {[
            { x: 10, y: 14, d: 0 },
            { x: 90, y: 10, d: 0.25 },
            { x: 82, y: 46, d: 0.5 },
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
