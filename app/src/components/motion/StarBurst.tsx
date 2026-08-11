import { motion } from 'motion/react'

/** Eight stars radiating outward from the center of its (relative) parent. */
export function StarBurst({ show, size = 90 }: { show: boolean; size?: number }) {
  if (!show) return null
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" data-testid="starburst">
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2
        return (
          <motion.span
            key={i}
            className="absolute text-3xl"
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
            animate={{
              x: Math.cos(angle) * size,
              y: Math.sin(angle) * size,
              opacity: 0,
              scale: 1.2,
            }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            ⭐
          </motion.span>
        )
      })}
    </div>
  )
}
