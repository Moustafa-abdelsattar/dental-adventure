export const springs = {
  soft: { type: 'spring', stiffness: 180, damping: 20 },
  playful: { type: 'spring', stiffness: 350, damping: 16 },
  snappy: { type: 'spring', stiffness: 500, damping: 28 },
} as const

export type SpringToken = keyof typeof springs
