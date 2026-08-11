import { motion } from 'motion/react'
import { springs } from '../../lib/springs'
import { toolPalette as P } from '../tools/palette'

/**
 * Dr. Nour — the friendly dentist the board forgot.
 * Rendered masked first; tapping the mask slides it down to reveal her smile,
 * teaching that the masked stranger is a smiling helper underneath.
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
    <motion.svg
      viewBox="0 0 160 220"
      width={size}
      animate={idle ? { y: [0, -4, 0] } : {}}
      transition={{ duration: 3.5, repeat: idle ? Infinity : 0, ease: 'easeInOut' }}
      style={{ overflow: 'visible' }}
      role="img"
      aria-label="Dr. Nour"
      data-testid="drnour"
    >
      {/* scrubs */}
      <path d="M40 140 Q80 120 120 140 L128 210 L32 210 Z" fill="#8b6fd8" />
      <rect x="66" y="150" width="28" height="34" rx="8" fill="#7a5fc7" />
      {/* neck + head */}
      <rect x="70" y="108" width="20" height="18" rx="8" fill="#f0b48f" />
      <circle cx="80" cy="78" r="40" fill="#f5c29e" />
      {/* rounded hair */}
      <path d="M40 76 C40 40 60 30 80 30 C100 30 120 40 120 76 C120 60 108 48 80 48 C52 48 40 60 40 76 Z" fill="#5a4638" />
      <path d="M40 76 Q38 92 44 100 L48 78 Z" fill="#5a4638" />
      <path d="M120 76 Q122 92 116 100 L112 78 Z" fill="#5a4638" />
      {/* eyes — always warm and visible above the mask */}
      <circle cx="66" cy="74" r="4.5" fill={P.outline} />
      <circle cx="94" cy="74" r="4.5" fill={P.outline} />
      <path d="M58 64 q8 -6 16 0" stroke="#5a4638" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M86 64 q8 -6 16 0" stroke="#5a4638" strokeWidth="3" fill="none" strokeLinecap="round" />
      {masked ? (
        <motion.g
          id="drnour-mask"
          data-testid="drnour-mask"
          onClick={onMaskTap}
          initial={false}
          whileTap={{ scale: 0.96 }}
          transition={springs.soft}
          style={{ cursor: 'pointer' }}
        >
          <path d="M52 84 Q80 78 108 84 L104 106 Q80 116 56 106 Z" fill="#bfe3f7" stroke={P.accent} strokeWidth="3" />
          <line x1="52" y1="86" x2="42" y2="76" stroke={P.accent} strokeWidth="3" strokeLinecap="round" />
          <line x1="108" y1="86" x2="118" y2="76" stroke={P.accent} strokeWidth="3" strokeLinecap="round" />
        </motion.g>
      ) : (
        <motion.g initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={springs.soft} data-testid="drnour-smile">
          <circle cx="60" cy="92" r="6" fill="#f9a8c5" opacity="0.6" />
          <circle cx="100" cy="92" r="6" fill="#f9a8c5" opacity="0.6" />
          <path d="M64 94 Q80 110 96 94" stroke="#b0654a" strokeWidth="4" fill="none" strokeLinecap="round" />
        </motion.g>
      )}
    </motion.svg>
  )
}
