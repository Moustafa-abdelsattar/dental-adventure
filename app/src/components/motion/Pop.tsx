import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { springs } from '../../motion/springs'

export function Pop({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...springs.playful, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
