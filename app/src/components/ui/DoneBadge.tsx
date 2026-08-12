import { motion } from 'motion/react'

/**
 * The game-wide "you did this!" mark: a mint circle with a drawn check that
 * pops in with a bounce. Deliberately not a star — stars are the journey
 * currency, this marks a finished item or step.
 */
export function DoneBadge({ className = 'w-9 h-9', testid }: { className?: string; testid?: string }) {
  return (
    <motion.span
      data-testid={testid}
      initial={{ scale: 0, rotate: -30 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 14 }}
      className={`${className} inline-flex items-center justify-center rounded-full bg-mint shadow-md ring-2 ring-white`}
    >
      <svg viewBox="0 0 24 24" className="w-3/5 h-3/5" aria-hidden>
        <path
          d="M5 12.5 L10 17.5 L19 7.5"
          fill="none"
          stroke="white"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.span>
  )
}
