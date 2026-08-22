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
import { loops, wiggle, wiggleTiming } from '../motion/springs'
import type { ModuleProps } from './registry'

const SEQUENCE: { toolId: ToolId; stepId: StringId }[] = [
  { toolId: 'spray', stepId: 'prepare.step.spray' },
  { toolId: 'brush', stepId: 'prepare.step.brush' },
]

/** How long each instrument spends at the tooth before the step is done. */
const SPRAY_MS = 1900
const BRUSH_MS = 2300
/** Spacing of the four scrubs, so the plaque clears under the brush. */
const SCRUB_MS = BRUSH_MS / 5

/**
 * Treatment practice: the sleepy juice, then the polishing brush.
 *
 * The screen used to be ring → umbrella → sleepy gel, and tapping a tool only
 * lit a tick on the tool itself. The rubber dam is gone with the two
 * instruments that made it, and the two that remain now do their job on screen:
 * the juice rises to the tooth and sprays it to sleep, and the brush follows and
 * scrubs the plaque off it. A child watching is told what is about to happen to
 * their own tooth, which a tick beside a picture never said.
 *
 * Only the correct next tool is active and pulsing; wrong taps wiggle gently.
 */
export function PrepareScreen({ onComplete }: ModuleProps) {
  const lang = useGame(s => s.lang)!
  const childName = useGame(s => s.childName)
  const [step, setStep] = useState(0)
  const [wiggleId, setWiggleId] = useState<ToolId | null>(null)
  /** The instrument currently at the tooth, mid-beat. */
  const [acting, setActing] = useState<ToolId | null>(null)
  const [sleepy, setSleepy] = useState(false)
  const [spots, setSpots] = useState([true, true, true, true])
  const doneRef = useRef(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const done = step >= SEQUENCE.length

  useEffect(() => {
    const intro = async () => {
      await audio.say(lang, 'prepare.intro')
      void audio.say(lang, SEQUENCE[0].stepId)
    }
    void intro()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms))

  // guarded completion so the fallback Next works even if narration hangs
  const completedRef = useRef(false)
  const completeOnce = () => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }

  const finishStep = async (next: number) => {
    setActing(null)
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

  const tapTool = (toolId: ToolId) => {
    if (done || acting) return
    if (toolId !== SEQUENCE[step].toolId) {
      setWiggleId(toolId)
      later(() => setWiggleId(null), 450)
      void audio.say(lang, 'milo.hint.tap')
      return
    }
    setActing(toolId)

    if (toolId === 'spray') {
      // the tooth drops off to sleep partway through the spray, not after it
      later(() => setSleepy(true), SPRAY_MS * 0.55)
      later(() => void finishStep(step + 1), SPRAY_MS)
      return
    }

    // the brush clears one plaque spot per pass, so the scrubbing is visibly
    // doing something rather than playing over a tooth that changes at the end
    spots.forEach((_, i) => later(() => setSpots(s => s.map((d, j) => (j === i ? false : d))), SCRUB_MS * (i + 1)))
    later(() => void finishStep(step + 1), BRUSH_MS)
  }

  return (
    <GameStage
      title={t(lang, 'prepare.title')}
      intro={t(lang, 'prepare.intro', { name: childName })}
      action={<GameButton label={t(lang, 'ui.next')} disabled={!done} onPress={completeOnce} />}
    >
      {/* The beats are anchored to the tooth's own box, not the stage's. Hung
          off the full-width wrapper they were sized against the screen, and an
          instrument meant to be a third of the tooth came in twice its size and
          sat over its face. */}
      <div className="relative w-full max-w-xs mx-auto aspect-square">
        <BigTooth spots={spots} sleepy={sleepy} sparkle={done} />
        {acting === 'spray' && <SprayBeat />}
        {acting === 'brush' && <BrushBeat />}
        <StarBurst show={done} />
      </div>

      <div className="shrink-0 grid grid-cols-2 gap-4 w-full max-w-[16rem]">
        {SEQUENCE.map(({ toolId }, i) => {
          const isNext = !done && !acting && i === step
          const used = i < step
          const Svg = TOOLS[toolId].Svg
          return (
            <motion.button
              key={toolId}
              data-testid={`prep-${toolId}`}
              onClick={() => tapTool(toolId)}
              animate={wiggleId === toolId ? wiggle : isNext ? { scale: [1, 1.1, 1] } : { scale: 1 }}
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

/**
 * The juice rises to the tooth, tips towards it and puffs.
 *
 * Sized by height, not width. These instruments are drawn very tall and narrow,
 * so a width that looked modest — a quarter of the tooth — came out seven tenths
 * of its height and stood over its face.
 *
 * It comes up from below because that is where its button is: the instrument a
 * child just pressed is the one that travels, so the tap and what happens next
 * are visibly the same event.
 */
function SprayBeat() {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none" data-testid="prepare-spray-beat">
      <motion.img
        src="/art/tool-spray.webp"
        alt=""
        draggable={false}
        className="absolute left-[56%] top-[44%] h-[44%] w-auto select-none drop-shadow-lg origin-bottom"
        initial={{ opacity: 0, y: 190, rotate: 0 }}
        animate={{ opacity: 1, y: 0, rotate: -24 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      />
      {/* the puff, drifting towards the tooth and thinning out */}
      {[0, 1, 2, 3, 4].map(i => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-grape/35"
          style={{ left: `${54 - i * 4}%`, top: `${50 + (i % 3) * 5}%`, width: 12 + i * 3, height: 12 + i * 3 }}
          initial={{ opacity: 0, scale: 0.4, x: 10 }}
          animate={{ opacity: [0, 0.8, 0], scale: [0.4, 1.15, 1.4], x: [-6, -34] }}
          transition={{ duration: 1.1, delay: 0.5 + i * 0.09, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

/** The brush rises and works across the crown, one pass per plaque spot. */
function BrushBeat() {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none" data-testid="prepare-brush-beat">
      <motion.img
        src="/art/tool-brush.webp"
        alt=""
        draggable={false}
        className="absolute left-[36%] top-[40%] h-[48%] w-auto select-none drop-shadow-lg origin-bottom"
        initial={{ opacity: 0, y: 190, rotate: 12 }}
        animate={{
          opacity: 1,
          y: [190, 0, 0, 0, 0, 0],
          x: [0, -34, 34, -22, 26, 0],
          rotate: [12, -14, 14, -10, 12, 0],
        }}
        transition={{ duration: 2.3, times: [0, 0.22, 0.42, 0.62, 0.82, 1], ease: 'easeInOut' }}
      />
    </div>
  )
}
