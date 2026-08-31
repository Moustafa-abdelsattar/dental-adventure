import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { audio } from '../lib/audio'
import { t, type StringId } from '../lib/i18n'
import { useGame } from '../store/game'
import { BigTooth } from '../game/BigTooth'
import { StarBurst } from '../components/motion/StarBurst'
import { Floating } from '../components/motion/Floating'
import { GameButton } from '../components/ui/GameButton'
import { GameStage } from '../game/GameStage'
import type { ModuleProps } from './registry'

const PAUSE_MS = 600
const ARABIC_COUNT_MS = 9237

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
      if (lang === 'ar') {
        const countLine = audio.say(lang, 'spray.countToTen' as StringId)
        for (let i = 1; i <= 10; i++) {
          setCount(i)
          await new Promise(r => setTimeout(r, ARABIC_COUNT_MS / 10))
        }
        await countLine
        setDone(true)
        completeOnce()
        return
      }
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
    <GameStage
      title={t(lang, 'spray.title')}
      intro={t(lang, 'spray.intro', { name: childName })}
      titleClassName="from-grape to-sky-deep"
      tone="night"
      scene={<NightSky />}
      action={<GameButton label={t(lang, 'ui.next')} disabled={!done} onPress={completeOnce} />}
    >
      <div className="relative w-full">
        {lang === 'ar' ? (
          <img
            src={count > 0 ? '/art/visit-step-count-ten.webp' : '/art/visit-step-count.webp'}
            alt=""
            data-testid="spray-count-art"
            className="mx-auto w-full max-w-[360px] select-none object-contain drop-shadow-xl"
            draggable={false}
          />
        ) : (
          <BigTooth sleepy={count > 0} sparkle={done} />
        )}
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
      {done && <p className="text-xl font-bold text-grape">{t(lang, 'spray.done', { name: childName })}</p>}
    </GameStage>
  )
}

/**
 * The quiet sky the counting happens under. Scenery in the world layer rather
 * than a row of content, so the tooth gets the whole subject area and the
 * moon can sit high where a night sky belongs.
 */
function NightSky() {
  return (
    <>
      {/* all of it below the caption band, so nothing drifts across the words */}
      <Floating duration={5} className="absolute start-[5%] top-[26%]">
        <img src="/art/moon.svg" alt="" className="w-12 select-none" draggable={false} />
      </Floating>
      <Floating duration={7} className="absolute end-[8%] top-[22%]">
        <img src="/art/star.svg" alt="" className="w-7 select-none" draggable={false} />
      </Floating>
      <Floating duration={6} className="absolute start-[4%] top-[56%]">
        <img src="/art/star.svg" alt="" className="w-4 opacity-70 select-none" draggable={false} />
      </Floating>
      <Floating duration={8} className="absolute end-[5%] top-[64%]">
        <img src="/art/star.svg" alt="" className="w-3 opacity-50 select-none" draggable={false} />
      </Floating>
    </>
  )
}
