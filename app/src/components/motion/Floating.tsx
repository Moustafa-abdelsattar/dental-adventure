import { motion } from 'motion/react'
import type { ReactNode } from 'react'

export function Floating({
  children,
  amplitude = 6,
  duration = 4,
  className,
}: {
  children: ReactNode
  amplitude?: number
  duration?: number
  className?: string
}) {
  return (
    <motion.div
      animate={{ y: [0, -amplitude, 0] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
