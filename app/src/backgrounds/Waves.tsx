import { motion } from 'motion/react'

/**
 * Two tones of water along the bottom of the sky, drifting against each other
 * on different periods so the pattern never visibly repeats. Wider than the
 * panel so the ends of the paths are always off-screen.
 */
export function Waves() {
  return (
    <>
      <motion.svg
        className="absolute -bottom-1 inset-x-0 w-[130%]"
        viewBox="0 0 480 100"
        preserveAspectRatio="none"
        animate={{ x: [0, -60, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M0 48 Q70 18 150 44 T310 40 T480 32 L480 100 L0 100 Z" fill="#7ec8f2" opacity="0.22" />
      </motion.svg>
      <motion.svg
        className="absolute -bottom-1 inset-x-0 w-[130%]"
        viewBox="0 0 480 100"
        preserveAspectRatio="none"
        animate={{ x: [-60, 0, -60] }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M0 66 Q90 40 190 62 T480 56 L480 100 L0 100 Z" fill="#7ec8f2" opacity="0.38" />
      </motion.svg>
    </>
  )
}
