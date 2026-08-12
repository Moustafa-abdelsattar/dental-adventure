import { useState } from 'react'
import { motion } from 'motion/react'
import { springs } from '../../lib/springs'
import { audio } from '../../lib/audio'
import { t, type Lang, type StringId } from '../../lib/i18n'
import { DoneBadge } from '../../components/ui/DoneBadge'
import { TOOLS, type ToolId } from './tools'

/**
 * One card in the family layout shared by all nine tools:
 * tool art on top, name below. While the tool is talking the card shows a
 * pulsing "listening" ring; once heard it gets a mint ring + check badge so
 * the child always knows which helpers are already done.
 * Tapping plays name → description → fun fact, then marks the tool as met.
 */
export function ToolCard({
  toolId,
  lang,
  met,
  onMet,
  index = 0,
}: {
  toolId: ToolId
  lang: Lang
  met: boolean
  onMet: (toolId: ToolId) => void
  index?: number
}) {
  const { Svg } = TOOLS[toolId]
  const [listening, setListening] = useState(false)

  const tap = async () => {
    setListening(true)
    await audio.say(lang, `tool.${toolId}.desc` as StringId)
    await audio.say(lang, `tool.${toolId}.fact` as StringId)
    setListening(false)
    onMet(toolId)
  }

  return (
    <motion.button
      data-testid={`tool-${toolId}`}
      onClick={() => void tap()}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.7, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ ...springs.playful, delay: index * 0.09 }}
      className={`relative bg-white rounded-3xl p-3 shadow-md flex flex-col items-center gap-1 min-h-[72px] ${
        met ? 'ring-2 ring-mint' : listening ? 'ring-4 ring-sky' : ''
      }`}
    >
      <div className="w-full aspect-square">
        <Svg demo={met || listening} />
      </div>
      <span className="font-bold text-sm text-center leading-tight min-h-[2.5em] flex items-center justify-center">
        {t(lang, `tool.${toolId}.name` as StringId)}
      </span>
      {listening && !met && (
        <motion.span
          data-testid={`listening-${toolId}`}
          aria-hidden
          className="absolute top-1.5 end-1.5 flex items-end gap-0.5 h-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="w-1.5 rounded-full bg-sky"
              animate={{ height: ['30%', '95%', '30%'] }}
              transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
            />
          ))}
        </motion.span>
      )}
      {met && <DoneBadge testid={`met-${toolId}`} className="absolute -top-2 -end-2 w-9 h-9" />}
    </motion.button>
  )
}
