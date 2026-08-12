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
    <motion.img
      src="/art/star.svg"
      alt=""
      className="fixed z-50 w-12 pointer-events-none select-none drop-shadow-[0_0_10px_rgba(255,212,94,0.9)]"
      initial={{ left: from.x, top: from.y, scale: 1.5, opacity: 1, rotate: -20 }}
      animate={{ left: to.x, top: to.y, scale: 0.6, opacity: 0.95, rotate: 20 }}
      transition={{ ...springs.playful, duration: 0.9 }}
      onAnimationComplete={onArrive}
      data-testid="starfly"
    />
  )
}
