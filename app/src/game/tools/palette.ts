/**
 * The ONE palette every tool draws from — six roles, nothing else.
 * Same stroke weight (4 on a 120x120 viewBox) and rounded geometry everywhere,
 * so the nine tools read as a single family.
 */
export const toolPalette = {
  body: '#eaf3ff',
  accent: '#3b7fc4',
  metal: '#c9d6ea',
  grip: '#f97ba9',
  sparkle: '#ffd45e',
  outline: '#3a3560',
} as const

export const TOOL_STROKE = 4
