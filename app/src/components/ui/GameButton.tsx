import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { springs } from '../../lib/springs'

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
      className={`min-h-[72px] px-8 rounded-full text-2xl font-bold shadow-lg flex items-center justify-center gap-3 ${colors} ${disabled ? 'opacity-40 saturate-50' : ''}`}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  )
}
