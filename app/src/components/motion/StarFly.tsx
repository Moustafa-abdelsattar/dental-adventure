import { motion } from 'motion/react'
import { springs } from '../../lib/springs'
import { hudTarget } from '../ui/ProgressHud'

/**
 * A star that flies from `from` (viewport coords) into the HUD star row,
 * then calls onArrive. Render inside a portal-free fixed layer.
 */
export function StarFly({ from, onArrive }: { from: { x: number; y: number }; onArrive: () => void }) {
  const target = hudTarget.current?.getBoundingClientRect()
  const to = target
    ? { x: target.left + target.width / 2, y: target.top + target.height / 2 }
    : { x: window.innerWidth - 60, y: 24 }
  return (
    <motion.span
      className="fixed z-50 text-4xl pointer-events-none"
      initial={{ left: from.x, top: from.y, scale: 1.6, opacity: 1 }}
      animate={{ left: to.x, top: to.y, scale: 0.7, opacity: 0.9 }}
      transition={{ ...springs.playful, duration: 0.9 }}
      onAnimationComplete={onArrive}
      data-testid="starfly"
    >
      ⭐
    </motion.span>
  )
}
