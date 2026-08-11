import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { springs } from '../../lib/springs'

export function FadeIn({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.soft, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
