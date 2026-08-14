import { motion } from 'motion/react'

/**
 * Slow gold glints in the sky. Deliberately sparse and long-cycled: they are
 * the "10%" wow layer, and at any higher rate they compete with the stars the
 * child actually earns.
 */
const GLINTS = [
  { cls: 'top-[24%] end-[20%] w-5', delay: 0 },
  { cls: 'top-[30%] start-[38%] w-3.5', delay: 1.4 },
  { cls: 'top-[42%] end-[8%] w-3', delay: 2.6 },
]

export function Sparkles() {
  return (
    <>
      {GLINTS.map(s => (
        <motion.img
          key={s.cls}
          src="/art/star.svg"
          alt=""
          className={`absolute ${s.cls} select-none`}
          animate={{ opacity: [0, 0.9, 0], scale: [0.5, 1.1, 0.5], rotate: [0, 25, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
        />
      ))}
    </>
  )
}
