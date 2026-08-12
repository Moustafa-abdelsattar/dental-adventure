import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { audio } from '../lib/audio'
import { t, type StringId } from '../lib/i18n'
import { useGame } from '../store/game'
import { BigTooth } from '../game/BigTooth'
import { StarBurst } from '../components/motion/StarBurst'
import { Floating } from '../components/motion/Floating'
import { GameButton } from '../components/ui/GameButton'
import type { ModuleProps } from './registry'

const PAUSE_MS = 600

/**
 * The calm counting mission. Milo counts ALOUD from one to ten, slowly —
 * the floating number bubbles are for the parent reading along. Success is
 * unconditional: there is nothing to fail and nothing the app pretends to verify.
 */
export function SprayScreen({ onComplete }: ModuleProps) {
  const lang = useGame(s => s.lang)!
  const childName = useGame(s => s.childName)
  const [count, setCount] = useState(0)
  const [done, setDone] = useState(false)
  const startedRef = useRef(false)

  // guarded completion so the fallback Next works even if narration hangs
  const completedRef = useRef(false)
  const completeOnce = () => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    const run = async () => {
      await audio.say(lang, 'spray.intro')
      await new Promise(r => setTimeout(r, PAUSE_MS))
      for (let i = 1; i <= 10; i++) {
        setCount(i)
        await audio.say(lang, `spray.count.${i}` as StringId)
        await new Promise(r => setTimeout(r, PAUSE_MS))
      }
      setDone(true)
      await audio.say(lang, 'spray.done')
      completeOnce()
    }
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] flex flex-col items-center justify-center px-4 pb-10 bg-gradient-to-b from-grape/30 via-sky/15 to-transparent">
      <h1 className="text-3xl font-bold mb-1 bg-gradient-to-b from-grape to-sky-deep bg-clip-text text-transparent">
        {t(lang, 'spray.title')}
      </h1>
      <p className="text-ink/60 font-bold mb-3 text-center">{t(lang, 'spray.intro', { name: childName })}</p>

      {/* quiet night sky */}
      <div className="relative w-full max-w-xs h-14 mb-1" aria-hidden>
        <Floating duration={5} className="absolute start-4 top-0">
          <img src="/art/moon.svg" alt="" className="w-10 select-none" draggable={false} />
        </Floating>
        <Floating duration={7} className="absolute end-8 top-1">
          <img src="/art/star.svg" alt="" className="w-7 select-none" draggable={false} />
        </Floating>
        <Floating duration={6} className="absolute start-1/2 top-5">
          <img src="/art/star.svg" alt="" className="w-4 opacity-70 select-none" draggable={false} />
        </Floating>
      </div>

      <div className="relative w-full">
        <BigTooth sleepy={count > 0} sparkle={done} />
        <StarBurst show={done} />
        {count > 0 && !done && (
          <motion.div
            key={count}
            data-testid="count-bubble"
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: [0, 1, 0.8], scale: [0.5, 1.2, 1], y: [10, -6, -12] }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            className="absolute top-2 inset-x-0 flex justify-center pointer-events-none"
          >
            <span className="bg-white/90 rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold text-grape shadow-lg">
              {count}
            </span>
          </motion.div>
        )}
      </div>
      {done && <p className="text-xl font-bold text-grape mt-2">{t(lang, 'spray.done', { name: childName })}</p>}

      <div data-testid="next-fallback" className="mt-4 w-full max-w-xs flex flex-col">
        <GameButton label={t(lang, 'ui.next')} disabled={!done} onPress={completeOnce} />
      </div>
    </div>
  )
}
