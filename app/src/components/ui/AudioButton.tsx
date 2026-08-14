import { motion } from 'motion/react'
import { springs } from '../../motion/springs'
import { audio } from '../../lib/audio'
import { useGame } from '../../store/game'

/**
 * "Hear it again." A four-year-old cannot read the line they just missed, so
 * every screen needs one obvious way to play it back rather than relying on
 * the child guessing that the text itself is tappable.
 *
 * The label is an accessibility label only — it is never spoken by the app, so
 * it costs no narration clip and deliberately does not live in
 * `content/strings`, which is frozen against copy churn.
 */
const LABEL = { en: 'Hear it again', ar: 'اسمعها تاني' }

export function AudioButton({ onPress }: { onPress?: () => void }) {
  const lang = useGame(s => s.lang) ?? 'en'
  return (
    <motion.button
      type="button"
      data-testid="audio-replay"
      aria-label={LABEL[lang]}
      whileTap={{ scale: 0.9 }}
      transition={springs.snappy}
      onClick={() => (onPress ? onPress() : void audio.replayLast())}
      className="shrink-0 w-11 h-11 rounded-full bg-white/80 shadow-md flex items-center justify-center text-sky-deep"
    >
      <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden>
        <path d="M4 9.5 h3.2 L12 5.4 v13.2 L7.2 14.5 H4 Z" fill="currentColor" />
        <path
          d="M15.6 8.6 a4.6 4.6 0 0 1 0 6.8 M18.2 6 a8.2 8.2 0 0 1 0 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </motion.button>
  )
}
