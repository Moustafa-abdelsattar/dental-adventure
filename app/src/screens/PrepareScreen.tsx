import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { audio } from '../lib/audio'
import { t, type StringId } from '../lib/i18n'
import { useGame } from '../store/game'
import { BigTooth } from '../game/BigTooth'
import { TOOLS, type ToolId } from '../game/tools/tools'
import { StarBurst } from '../components/motion/StarBurst'
import { DoneBadge } from '../components/ui/DoneBadge'
import { GameButton } from '../components/ui/GameButton'
import { GameStage } from '../game/GameStage'
import { loops, wiggle, wiggleTiming } from '../lib/springs'
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

  // guarded completion so the fallback Next works even if narration hangs
  const completedRef = useRef(false)
  const completeOnce = () => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }

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
      completeOnce()
    }
  }

  return (
    <GameStage
      title={t(lang, 'prepare.title')}
      intro={t(lang, 'prepare.intro', { name: childName })}
      action={<GameButton label={t(lang, 'ui.next')} disabled={!done} onPress={completeOnce} />}
    >
      <div className="relative w-full">
        <BigTooth showRing={step >= 1} showUmbrella={step >= 2} sleepy={done} sparkle={done} />
        <StarBurst show={done} />
      </div>

      <div className="shrink-0 grid grid-cols-3 gap-3 w-full max-w-sm">
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
                  ? wiggle
                  : isNext
                    ? { scale: [1, 1.1, 1] }
                    : { scale: 1 }
              }
              transition={
                wiggleId === toolId ? wiggleTiming : isNext ? loops.breathe : { duration: loops.breathe.duration }
              }
              className={`relative aspect-square rounded-3xl bg-white shadow-lg p-2 ${isNext ? 'ring-4 ring-sunny' : ''} ${!isNext && !used ? 'opacity-40' : ''} ${used ? 'ring-2 ring-mint' : ''}`}
            >
              <Svg demo={used} />
              {used && <DoneBadge testid={`prep-done-${toolId}`} className="absolute -top-2 -end-2 w-8 h-8" />}
            </motion.button>
          )
        })}
      </div>

    </GameStage>
  )
}
