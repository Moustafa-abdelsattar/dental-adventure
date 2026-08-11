import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { audio } from '../lib/audio'
import { t, type StringId } from '../lib/i18n'
import { useGame } from '../store/game'
import { BigTooth } from '../game/BigTooth'
import { TOOLS, type ToolId } from '../game/tools/tools'
import { StarBurst } from '../components/motion/StarBurst'
import type { ModuleProps } from './registry'

const SEQUENCE: { toolId: ToolId; stepId: StringId }[] = [
  { toolId: 'ring', stepId: 'prepare.step.ring' },
  { toolId: 'umbrella', stepId: 'prepare.step.umbrella' },
  { toolId: 'spray', stepId: 'prepare.step.spray' },
]

/**
 * Treatment practice: the guided ring → umbrella → spray sequence.
 * Only the correct next tool is active and pulsing; wrong taps wiggle gently.
 */
export function PrepareScreen({ onComplete }: ModuleProps) {
  const lang = useGame(s => s.lang)!
  const childName = useGame(s => s.childName)
  const [step, setStep] = useState(0)
  const [wiggleId, setWiggleId] = useState<ToolId | null>(null)
  const doneRef = useRef(false)
  const done = step >= SEQUENCE.length

  useEffect(() => {
    const intro = async () => {
      await audio.say(lang, 'prepare.intro')
      void audio.say(lang, SEQUENCE[0].stepId)
    }
    void intro()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tapTool = async (toolId: ToolId) => {
    if (done) return
    if (toolId !== SEQUENCE[step].toolId) {
      setWiggleId(toolId)
      setTimeout(() => setWiggleId(null), 450)
      void audio.say(lang, 'milo.hint.tap')
      return
    }
    const next = step + 1
    setStep(next)
    if (next < SEQUENCE.length) {
      await audio.say(lang, 'milo.great')
      void audio.say(lang, SEQUENCE[next].stepId)
    } else if (!doneRef.current) {
      doneRef.current = true
      await audio.say(lang, 'prepare.done')
      onComplete()
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center px-4 pb-8">
      <h1 className="text-2xl font-bold mt-2 mb-1">{t(lang, 'prepare.title')}</h1>
      <p className="text-ink/60 font-bold mb-3 text-center">{t(lang, 'prepare.intro', { name: childName })}</p>

      <div className="relative w-full">
        <BigTooth showRing={step >= 1} showUmbrella={step >= 2} sleepy={done} sparkle={done} />
        <StarBurst show={done} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 w-full max-w-sm">
        {SEQUENCE.map(({ toolId }, i) => {
          const isNext = !done && i === step
          const used = i < step
          const Svg = TOOLS[toolId].Svg
          return (
            <motion.button
              key={toolId}
              data-testid={`prep-${toolId}`}
              onClick={() => void tapTool(toolId)}
              animate={
                wiggleId === toolId
                  ? { x: [0, -6, 6, -4, 0] }
                  : isNext
                    ? { scale: [1, 1.1, 1] }
                    : { scale: 1 }
              }
              transition={wiggleId === toolId ? { duration: 0.4 } : { duration: 1.4, repeat: isNext ? Infinity : 0 }}
              className={`aspect-square rounded-3xl bg-white shadow-lg p-2 ${isNext ? 'ring-4 ring-sunny' : ''} ${!isNext && !used ? 'opacity-40' : ''} ${used ? 'ring-2 ring-mint' : ''}`}
            >
              <Svg demo={used} />
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
