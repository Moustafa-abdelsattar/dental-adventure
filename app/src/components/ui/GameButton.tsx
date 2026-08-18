import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { springs } from '../../motion/springs'

export function GameButton({
  label,
  icon,
  onPress,
  variant = 'primary',
  pulsing = false,
  disabled = false,
}: {
  label: string
  icon?: ReactNode
  onPress: () => void
  variant?: 'primary' | 'ghost' | 'mint'
  pulsing?: boolean
  disabled?: boolean
}) {
  const colors = {
    primary: 'bg-bubblegum text-white shadow-bubblegum/40',
    mint: 'bg-mint text-white shadow-mint/40',
    ghost: 'bg-white/85 text-ink shadow-ink/10',
  }[variant]
  return (
    <motion.button
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      animate={
        pulsing && !disabled
          ? { boxShadow: ['0 0 0 0px rgba(249,123,169,0.45)', '0 0 0 16px rgba(249,123,169,0)'] }
          : {}
      }
      transition={pulsing && !disabled ? { duration: 1.6, repeat: Infinity, ease: 'easeOut' } : springs.snappy}
      onClick={() => !disabled && onPress()}
      // A disabled Next is a safety net — it exists so a hung narration clip can
      // never strand a child on a finished module — but it used to be the
      // largest and loudest thing on every screen while doing nothing at all.
      // Off, it shrinks to a quiet ghost; on, it is unmistakable.
      className={`rounded-full font-bold flex items-center justify-center gap-3 transition-all ${
        disabled
          ? // and transparent to a finger: it floats over the scene now, and a
            // dead button that still swallows taps was covering the visit
            // screen's raise-your-hand target
            'min-h-[44px] px-5 text-base bg-white/50 text-ink/35 shadow-none self-center pointer-events-none'
          : `min-h-[72px] px-8 text-2xl shadow-lg ${colors}`
      }`}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  )
}
