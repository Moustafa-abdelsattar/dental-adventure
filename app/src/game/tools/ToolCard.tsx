import { motion } from 'motion/react'
import { springs } from '../../lib/springs'
import { audio } from '../../lib/audio'
import { t, type Lang, type StringId } from '../../lib/i18n'
import { TOOLS, type ToolId } from './tools'

/**
 * One card in the family layout shared by all nine tools:
 * tool art on top, name below, gold check once met.
 * Tapping plays name → description → fun fact, then marks the tool as met.
 */
export function ToolCard({
  toolId,
  lang,
  met,
  onMet,
}: {
  toolId: ToolId
  lang: Lang
  met: boolean
  onMet: (toolId: ToolId) => void
}) {
  const { Svg } = TOOLS[toolId]

  const tap = async () => {
    await audio.say(lang, `tool.${toolId}.desc` as StringId)
    await audio.say(lang, `tool.${toolId}.fact` as StringId)
    onMet(toolId)
  }

  return (
    <motion.button
      data-testid={`tool-${toolId}`}
      onClick={() => void tap()}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.playful}
      className="relative bg-white rounded-3xl p-3 shadow-md flex flex-col items-center gap-1 min-h-[72px]"
    >
      <div className="w-full aspect-square">
        <Svg demo={met} />
      </div>
      <span className="font-bold text-sm text-center leading-tight">{t(lang, `tool.${toolId}.name` as StringId)}</span>
      {met && (
        <span
          className="absolute top-1 end-1 bg-sunny text-white rounded-full w-7 h-7 flex items-center justify-center text-sm shadow"
          data-testid={`met-${toolId}`}
        >
          ⭐
        </span>
      )}
    </motion.button>
  )
}
