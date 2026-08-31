import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { audio } from '../lib/audio'
import { t, type StringId } from '../lib/i18n'
import { useGame } from '../store/game'
import { BigTooth, SPOT_POS } from '../game/BigTooth'
import { TOOLS, type ToolId } from '../game/tools/tools'
import { StarBurst } from '../components/motion/StarBurst'
import { DoneBadge } from '../components/ui/DoneBadge'
import { GameButton } from '../components/ui/GameButton'
import { GameStage } from '../game/GameStage'
import { loops, wiggle, wiggleTiming } from '../motion/springs'
import type { ModuleProps } from './registry'

/** How many different things Milo can say when a spot comes clean. */
const PRAISE_LINES = 4

const SEQUENCE: { toolId: ToolId; stepId: StringId }[] = [
  { toolId: 'spray', stepId: 'prepare.step.spray' },
  { toolId: 'brush', stepId: 'prepare.step.brush' },
]

/** How long the tooth waits with closed eyes before the juice appears. */
const SPRAY_EYES_LEAD_MS = 500
/** How long the juice spends at the tooth before the visual beat is done. */
const SPRAY_MS = 1900
/** How long the brush takes to reach a spot before that spot comes clean. */
const REACH_MS = 320
/** Where the brush waits between spots, as a share of the tooth's box. */
const BRUSH_PARK = { x: 50, y: 74 }

/**
 * Treatment practice: the sleepy juice, then the polishing brush.
 *
 * The screen used to be ring → umbrella → sleepy gel, and tapping a tool only
 * lit a tick on the tool itself. The rubber dam is gone with the two
 * instruments that made it, and the two that remain now do their job on screen.
 *
 * The juice is watched: the tooth closes its eyes first, then the juice rises,
 * tips towards the tooth and puffs. The cleaning is not — the brush comes up
 * and then waits, and the child presses each sticky spot themselves. The brush
 * travels to whichever one they pressed and that spot comes away under it. A
 * child who cleans the tooth has done something; a child who watches a brush
 * clean it by itself has only waited.
 *
 * Only the correct next tool is active and pulsing; wrong taps wiggle gently.
 */
export function PrepareScreen({ onComplete }: ModuleProps) {
  const lang = useGame(s => s.lang)!
  const childName = useGame(s => s.childName)
  const [step, setStep] = useState(0)
  const [introDone, setIntroDone] = useState(false)
  const [wiggleId, setWiggleId] = useState<ToolId | null>(null)
  /** The instrument currently at the tooth, mid-beat. */
  const [acting, setActing] = useState<ToolId | null>(null)
  const [sprayVisible, setSprayVisible] = useState(false)
  const [sleepy, setSleepy] = useState(false)
  const [spots, setSpots] = useState([true, true, true, true])
  /** Set once the brush is up and the tooth is waiting to be pressed. */
  const [scrubbing, setScrubbing] = useState(false)
  const [brushAt, setBrushAt] = useState(BRUSH_PARK)
  const spotsRef = useRef([true, true, true, true])
  const doneRef = useRef(false)
  const decayRemovalSfxStarted = useRef(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const done = step >= SEQUENCE.length

  useEffect(() => {
    let alive = true
    const intro = async () => {
      if (lang === 'ar') {
        setIntroDone(true)
        return
      }
      await audio.say(lang, 'prepare.intro')
      if (!alive) return
      await audio.say(lang, SEQUENCE[0].stepId)
      if (alive) setIntroDone(true)
    }
    void intro()
    return () => {
      alive = false
    }
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
    setSprayVisible(false)
    setStep(next)
    if (next < SEQUENCE.length) {
      setIntroDone(false)
      if (lang !== 'ar') await audio.say(lang, 'milo.great')
      await audio.say(lang, SEQUENCE[next].stepId)
      setIntroDone(true)
    } else if (!doneRef.current) {
      doneRef.current = true
      await audio.say(lang, 'prepare.done')
      completeOnce()
    }
  }

  const tapTool = (toolId: ToolId) => {
    if (!introDone || done || acting || scrubbing) return
    if (toolId !== SEQUENCE[step].toolId) {
      setWiggleId(toolId)
      later(() => setWiggleId(null), 450)
      if (lang !== 'ar') void audio.say(lang, 'milo.hint.tap')
      return
    }

    if (toolId === 'spray') {
      setActing(toolId)
      setSleepy(true)
      setSprayVisible(false)
      later(() => setSprayVisible(true), SPRAY_EYES_LEAD_MS)
      const visualDone = new Promise<void>(resolve => later(resolve, SPRAY_EYES_LEAD_MS + SPRAY_MS))
      const narrationDone = lang === 'ar' ? audio.say(lang, 'prepare.step.spray') : Promise.resolve()
      void Promise.all([visualDone, narrationDone]).then(() => finishStep(step + 1))
      return
    }

    // The brush does not clean anything on its own. It comes up, parks, and
    // hands the job to the child.
    setActing(toolId)
    setScrubbing(true)
    decayRemovalSfxStarted.current = false
    if (lang !== 'ar') void audio.say(lang, 'prepare.step.scrub')
  }

  /** A sticky spot has been pressed: send the brush to it, then wipe it. */
  const tapSpot = (i: number) => {
    if (!scrubbing) return
    const current = spotsRef.current
    if (!current[i]) return

    setBrushAt({ x: (SPOT_POS[i].cx / 200) * 100, y: (SPOT_POS[i].cy / 200) * 100 })
    later(() => {
      const next = [...spotsRef.current]
      next[i] = false
      spotsRef.current = next
      setSpots(next)
      if (lang === 'ar' && !decayRemovalSfxStarted.current) {
        decayRemovalSfxStarted.current = true
        audio.playDecayRemovalSfx()
      }

      if (next.some(Boolean)) {
        // A different line each time. Indexed by how many spots have gone, so
        // the four are heard in order whichever order they are pressed in.
        const cleaned = next.filter(dirty => !dirty).length
        if (lang !== 'ar') void audio.say(lang, `milo.praise.${Math.min(cleaned, PRAISE_LINES)}` as StringId)
        later(() => setBrushAt(BRUSH_PARK), 420)
      } else {
        setScrubbing(false)
        setActing(null)
        void finishStep(step + 1)
      }
    }, REACH_MS)
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
        <BigTooth spots={spots} sleepy={sleepy} sparkle={done} onSpotTap={scrubbing ? tapSpot : undefined} />
        {acting === 'spray' && sprayVisible && <SprayBeat />}
        {acting === 'brush' && <BrushBeat at={brushAt} />}
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
              disabled={!introDone || (!isNext && !used)}
              onClick={() => tapTool(toolId)}
              animate={wiggleId === toolId ? wiggle : isNext ? { scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={
                wiggleId === toolId ? wiggleTiming : isNext ? loops.breathe : { duration: loops.breathe.duration }
              }
              className={`relative aspect-square rounded-3xl bg-white shadow-lg p-2 ${isNext && introDone ? 'ring-4 ring-sunny' : ''} ${(!isNext && !used) || !introDone ? 'opacity-40' : ''} ${used ? 'ring-2 ring-mint' : ''}`}
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

/**
 * The brush rises and then goes wherever the child sends it.
 *
 * `at` is the spot they just pressed, in the tooth's own percentage space, so
 * the instrument arrives on the plaque rather than near it.
 */
function BrushBeat({ at }: { at: { x: number; y: number } }) {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none" data-testid="prepare-brush-beat">
      <motion.img
        src="/art/tool-brush.webp"
        alt=""
        draggable={false}
        className="absolute h-[48%] w-auto select-none drop-shadow-lg origin-bottom"
        initial={{ opacity: 0, y: 190, left: `${BRUSH_PARK.x}%`, top: `${BRUSH_PARK.y}%` }}
        animate={{ opacity: 1, y: 0, left: `${at.x}%`, top: `${at.y}%`, rotate: [0, -8, 8, 0] }}
        transition={{
          left: { duration: 0.32, ease: 'easeInOut' },
          top: { duration: 0.32, ease: 'easeInOut' },
          y: { duration: 0.5, ease: 'easeOut' },
          opacity: { duration: 0.3 },
          rotate: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
        }}
        style={{ x: '-50%', y: '-72%' }}
      />
    </div>
  )
}
