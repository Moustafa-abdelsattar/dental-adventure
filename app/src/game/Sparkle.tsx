import { motion } from 'motion/react'
import { toolPalette as P } from './tools/palette'

export function Sparkle({ x, y, delay = 0, size = 7 }: { x: number; y: number; delay?: number; size?: number }) {
  return (
    <motion.path
      d={`M${x} ${y - size} L${x + size / 3} ${y - size / 3} L${x + size} ${y} L${x + size / 3} ${y + size / 3} L${x} ${y + size} L${x - size / 3} ${y + size / 3} L${x - size} ${y} L${x - size / 3} ${y - size / 3} Z`}
      fill={P.sparkle}
      animate={{ opacity: [0, 1, 0], scale: [0.6, 1.2, 0.6] }}
      transition={{ duration: 1.2, repeat: Infinity, delay }}
    />
  )
}
