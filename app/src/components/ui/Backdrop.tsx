import { motion } from 'motion/react'
import { Floating } from '../motion/Floating'

/**
 * The sky behind every screen: layered gradient with a warm glow,
 * depth-blurred drifting clouds, slow gold sparkles, and animated
 * two-tone waves along the bottom.
 */
export function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-sky/45 via-cream to-cream" />
      {/* warm glow behind the hero area */}
      <div className="absolute top-[14%] start-1/2 -translate-x-1/2 w-[130%] aspect-square rounded-full bg-[radial-gradient(circle,rgba(255,244,214,0.85)_0%,rgba(255,244,214,0)_60%)]" />

      {/* clouds at three depths */}
      <Floating duration={9} amplitude={7} className="absolute top-[6%] start-[4%] opacity-90">
        <Cloud w={120} />
      </Floating>
      <Floating duration={12} amplitude={10} className="absolute top-[15%] end-[6%] opacity-60 blur-[1px]">
        <Cloud w={90} />
      </Floating>
      <Floating duration={15} amplitude={6} className="absolute top-[34%] start-[12%] opacity-35 blur-[2px]">
        <Cloud w={64} />
      </Floating>

      {/* slow gold sparkles */}
      {[
        { cls: 'top-[24%] end-[20%] w-5', d: 0 },
        { cls: 'top-[10%] start-[38%] w-3.5', d: 1.4 },
        { cls: 'top-[42%] end-[8%] w-3', d: 2.6 },
      ].map(s => (
        <motion.img
          key={s.cls}
          src="/art/star.svg"
          alt=""
          className={`absolute ${s.cls} select-none`}
          animate={{ opacity: [0, 0.9, 0], scale: [0.5, 1.1, 0.5], rotate: [0, 25, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, delay: s.d, ease: 'easeInOut' }}
        />
      ))}

      {/* animated two-tone waves */}
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
    </div>
  )
}

function Cloud({ w }: { w: number }) {
  return (
    <svg width={w} viewBox="0 0 110 60">
      <ellipse cx="35" cy="40" rx="30" ry="18" fill="white" />
      <ellipse cx="65" cy="32" rx="26" ry="20" fill="white" />
      <ellipse cx="88" cy="44" rx="20" ry="14" fill="white" />
    </svg>
  )
}
