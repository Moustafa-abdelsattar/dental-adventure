import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { springs } from '../lib/springs'
import { audio } from '../lib/audio'
import { t } from '../lib/i18n'
import { useGame } from '../store/game'
import { BigTooth } from '../game/BigTooth'
import { TOOLS } from '../game/tools/tools'
import { StarBurst } from '../components/motion/StarBurst'
import { GameButton } from '../components/ui/GameButton'
import type { ModuleProps } from './registry'

/**
 * Checkup practice: pick up the brush, tap (or sweep over) the sticky spots
 * until the tooth sparkles. No fail states — a spot tap without the brush
 * just wiggles and Milo hints.
 */
export function PracticeBrushScreen({ onComplete }: ModuleProps) {
  const lang = useGame(s => s.lang)!
  const childName = useGame(s => s.childName)
  const [brushSelected, setBrushSelected] = useState(false)
  const [spots, setSpots] = useState([true, true, true, true])
  const [wiggle, setWiggle] = useState(0)
  const [done, setDone] = useState(false)
  const doneRef = useRef(false)
  // ref mirror so rapid taps in one frame don't read stale state and lose a spot
  const spotsRef = useRef(spots)
  const BrushSvg = TOOLS.brush.Svg

  useEffect(() => {
    void audio.say(lang, 'practice.brush.intro')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // guarded completion so the fallback Next works even if narration hangs
  const completedRef = useRef(false)
  const completeOnce = () => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }

  const tapSpot = async (i: number) => {
    if (!brushSelected) {
      setWiggle(w => w + 1)
      void audio.say(lang, 'milo.hint.tap')
      return
    }
    const next = [...spotsRef.current]
    if (!next[i]) return
    next[i] = false
    spotsRef.current = next
    setSpots(next)
    if (next.some(Boolean)) {
      void audio.say(lang, 'milo.great')
    } else if (!doneRef.current) {
      doneRef.current = true
      setDone(true)
      await audio.say(lang, 'practice.brush.done')
      completeOnce()
    }
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] flex flex-col items-center justify-center px-4 pb-10">
      <h1 className="text-3xl font-bold mb-1 bg-gradient-to-b from-sky-deep to-grape bg-clip-text text-transparent">
        {t(lang, 'practice.brush.title')}
      </h1>
      <p className="text-ink/60 font-bold mb-3 text-center">{t(lang, 'practice.brush.intro', { name: childName })}</p>

      <motion.div
        key={wiggle}
        animate={wiggle ? { x: [0, -6, 6, -4, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="relative w-full"
      >
        <BigTooth spots={spots} sparkle={done} onSpotTap={i => void tapSpot(i)} onBodyTap={() => void tapSpot(-1)} />
        <StarBurst show={done} />
      </motion.div>

      <motion.button
        data-testid="pick-brush"
        onClick={() => {
          setBrushSelected(true)
          void audio.say(lang, 'tool.brush.name')
        }}
        animate={brushSelected ? { scale: 1.12, rotate: [-3, 3, -3] } : { scale: [1, 1.06, 1] }}
        transition={brushSelected ? { rotate: { duration: 1.6, repeat: Infinity }, scale: springs.snappy } : { duration: 1.8, repeat: Infinity }}
        className={`mt-4 w-28 h-28 rounded-3xl bg-white shadow-lg p-2 ${brushSelected ? 'ring-4 ring-sunny' : ''}`}
        aria-label={t(lang, 'tool.brush.name')}
      >
        <BrushSvg demo={brushSelected} />
      </motion.button>

      <div data-testid="next-fallback" className="mt-4 w-full max-w-xs flex flex-col">
        <GameButton label={t(lang, 'ui.next')} disabled={!done} onPress={completeOnce} />
      </div>
    </div>
  )
}
