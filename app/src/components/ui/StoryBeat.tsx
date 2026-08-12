import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { audio } from '../../lib/audio'
import { t, type StringId } from '../../lib/i18n'
import { useGame } from '../../store/game'
import { springs } from '../../lib/springs'

const LINGER_MS = 1100
const MIN_SHOW_MS = 2600

/**
 * A story moment between modules: Milo appears and tells the child how he
 * feels. His wobble shrinks as `calm` (0..1) grows — the visible half of his
 * arc from wiggly to steady. Tap anywhere to continue; otherwise it leaves
 * on its own once the line has been spoken.
 */
export function StoryBeat({ stringId, calm, onDone }: { stringId: StringId; calm: number; onDone: () => void }) {
  const lang = useGame(s => s.lang)!
  const childName = useGame(s => s.childName)
  const doneRef = useRef(false)

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    onDone()
  }

  useEffect(() => {
    const shownAt = Date.now()
    let alive = true
    void audio.say(lang, stringId).then(() => {
      if (!alive) return
      const wait = Math.max(LINGER_MS, MIN_SHOW_MS - (Date.now() - shownAt))
      setTimeout(() => alive && finish(), wait)
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stringId])

  // nervous Milo jitters fast and wide; calm Milo sways slow and small
  const amp = 9 - 7 * calm
  const wobbleDur = 0.9 + 1.6 * calm

  return (
    <AnimatePresence>
      <motion.div
        data-testid="story-beat"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={finish}
        className="fixed inset-0 z-50 bg-ink/25 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4 px-6 cursor-pointer"
      >
        <motion.img
          src="/art/milo.webp"
          alt="Milo"
          draggable={false}
          initial={{ scale: 0.5, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1, rotate: [-amp, amp, -amp] }}
          transition={{
            scale: springs.playful,
            y: springs.playful,
            opacity: { duration: 0.2 },
            rotate: { duration: wobbleDur, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="w-36 select-none drop-shadow-xl"
        />
        <motion.p
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ ...springs.soft, delay: 0.15 }}
          className="relative bg-white rounded-3xl px-6 py-4 text-xl font-bold shadow-xl max-w-sm text-center"
        >
          {t(lang, stringId, { name: childName })}
        </motion.p>
      </motion.div>
    </AnimatePresence>
  )
}
