import { motion } from 'motion/react'
import { springs } from '../../motion/springs'
import { audio } from '../../lib/audio'
import { t, type StringId } from '../../lib/i18n'
import { useGame } from '../../store/game'

/** Milo's speech bubble. Tap = hear the line again. */
export function SpeechBubble({ stringId }: { stringId: StringId }) {
  const lang = useGame(s => s.lang)
  const childName = useGame(s => s.childName)
  if (!lang) return null
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={springs.soft}
      onClick={() => void audio.replayLast()}
      className="relative bg-white rounded-3xl px-5 py-3 text-xl font-bold shadow-md max-w-[min(85vw,28rem)] text-center cursor-pointer"
    >
      {t(lang, stringId, { name: childName })}
      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 rounded-sm" />
    </motion.div>
  )
}
