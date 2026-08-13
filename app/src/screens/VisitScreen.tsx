import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { audio } from '../lib/audio'
import { t, type StringId } from '../lib/i18n'
import { useGame } from '../store/game'
import { DrNour } from '../game/drnour/DrNour'
import { Sparkle } from '../game/Sparkle'
import { GameButton } from '../components/ui/GameButton'
import { ModuleFrame } from '../components/ui/ModuleFrame'
import type { ModuleProps } from './registry'

type Phase = 'meet' | 'stop' | 'steps' | 'done'

const STEPS: { id: string; stringId: StringId }[] = [
  { id: 'chair', stringId: 'visit.step.chair' },
  { id: 'light', stringId: 'visit.step.light' },
  { id: 'mirror', stringId: 'visit.step.mirror' },
  { id: 'clean', stringId: 'visit.step.clean' },
]

const STEP_PAUSE_MS = 900
const FREEZE_MS = 1500

/**
 * The visit simulation: meet Dr. Nour (mask reveal), learn the raise-your-hand
 * stop signal, then walk the four calm steps of a real visit.
 */
export function VisitScreen({ onComplete }: ModuleProps) {
  const lang = useGame(s => s.lang)!
  const [phase, setPhase] = useState<Phase>('meet')
  const [masked, setMasked] = useState(true)
  const [frozen, setFrozen] = useState(false)
  const [step, setStep] = useState(-1)
  const startedSteps = useRef(false)
  const doneRef = useRef(false)

  const completeOnce = () => {
    if (doneRef.current) return
    doneRef.current = true
    onComplete()
  }

  useEffect(() => {
    void audio.say(lang, 'visit.meetDr')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const maskTap = async () => {
    if (!masked) return
    setMasked(false)
    await audio.say(lang, 'visit.maskOff')
    setPhase('stop')
    void audio.say(lang, 'visit.stopSignal')
  }

  const handTap = () => {
    if (frozen) return
    setFrozen(true)
    setTimeout(() => {
      setFrozen(false)
      void (async () => {
        await audio.say(lang, 'visit.stopSignalDone')
        setPhase('steps')
      })()
    }, FREEZE_MS)
  }

  useEffect(() => {
    if (phase !== 'steps' || startedSteps.current) return
    startedSteps.current = true
    const run = async () => {
      for (let i = 0; i < STEPS.length; i++) {
        setStep(i)
        await audio.say(lang, STEPS[i].stringId)
        await new Promise(r => setTimeout(r, STEP_PAUSE_MS))
      }
      setPhase('done')
      await audio.say(lang, 'visit.done')
      completeOnce()
    }
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  return (
    <ModuleFrame
      title={t(lang, 'visit.title')}
      onIntroTap={() => void audio.replayLast()}
      intro={
        <>
          {phase === 'meet' && t(lang, masked ? 'visit.meetDr' : 'visit.maskOff')}
          {phase === 'stop' && t(lang, 'visit.stopSignal')}
          {phase === 'steps' && step >= 0 && t(lang, STEPS[step].stringId)}
          {phase === 'done' && t(lang, 'visit.done')}
        </>
      }
      action={<GameButton label={t(lang, 'ui.next')} disabled={phase !== 'done'} onPress={completeOnce} />}
    >
      <div className="relative w-full max-w-md aspect-[4/5] rounded-3xl bg-white/60 shadow-inner overflow-hidden flex items-end justify-center">
        {/* soft ceiling light — glow fades in over >1s, deliberately no flash */}
        <motion.div
          data-testid="visit-light"
          data-glow-duration="1.2"
          className="absolute top-0 inset-x-0 h-1/3 bg-gradient-to-b from-sunny/50 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'steps' && step >= 1 && !frozen ? 1 : 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
        {/* the clinic light peeks from the top */}
        <img
          src="/art/clinic-light.webp"
          alt=""
          draggable={false}
          className="absolute -top-3 start-[8%] w-[30%] select-none opacity-95"
        />

        {/* peer child reclining on the chair — custom art */}
        <div className="absolute bottom-3 start-0 w-[64%]" data-testid="peer-child">
          <motion.img
            src="/art/visit-child-chair.webp"
            alt=""
            draggable={false}
            className="w-full select-none drop-shadow-md"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          {phase === 'steps' && step >= 2 && (
            <motion.img
              data-testid="mirror-near"
              src="/art/tool-mirror.webp"
              alt=""
              draggable={false}
              className="absolute top-[8%] start-[30%] w-[22%] select-none"
              initial={{ opacity: 0, x: 24, rotate: 20 }}
              animate={{ opacity: 1, x: 0, rotate: [0, -8, 0] }}
              transition={{ duration: 1.2 }}
            />
          )}
          {phase === 'steps' && step >= 3 && (
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
              <g data-testid="clean-sparkles">
                <Sparkle x={34} y={26} size={5} />
                <Sparkle x={48} y={38} delay={0.4} size={4} />
                <Sparkle x={26} y={44} delay={0.8} size={4} />
              </g>
            </svg>
          )}
        </div>

        <div className="absolute bottom-2 end-1 w-[44%]">
          <DrNour masked={masked} onMaskTap={() => void maskTap()} idle={!frozen} />
        </div>
      </div>

      {phase === 'stop' && (
        <motion.button
          data-testid="raise-hand"
          onClick={handTap}
          animate={frozen ? { scale: 1 } : { scale: [1, 1.1, 1] }}
          transition={{ duration: 1.2, repeat: frozen ? 0 : Infinity }}
          className="shrink-0 w-24 h-24 rounded-full bg-sunny shadow-lg flex items-center justify-center"
          aria-label="raise hand"
        >
          <RaisedHand className="w-14" />
        </motion.button>
      )}
      {frozen && (
        <svg viewBox="0 0 24 24" className="w-8 h-8" data-testid="paused-label" aria-label="paused">
          <rect x="5" y="4" width="5" height="16" rx="2.5" fill="#8b6fd8" />
          <rect x="14" y="4" width="5" height="16" rx="2.5" fill="#8b6fd8" />
        </svg>
      )}

      {phase === 'steps' && (
        <div className="shrink-0 flex gap-2" aria-hidden>
          {STEPS.map((s, i) => (
            <span key={s.id} className={`w-3 h-3 rounded-full ${i <= step ? 'bg-grape' : 'bg-grape/20'}`} />
          ))}
        </div>
      )}
    </ModuleFrame>
  )
}

/** Soft rounded raised hand, drawn to sit on the sunny button. */
function RaisedHand({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <g fill="#ee9250">
        {/* pinky → index */}
        <rect x="12" y="21" width="7.5" height="22" rx="3.75" />
        <rect x="21" y="13" width="8" height="28" rx="4" />
        <rect x="30.5" y="10" width="8" height="31" rx="4" />
        <rect x="40" y="15" width="7.5" height="26" rx="3.75" />
        {/* thumb */}
        <rect x="44.5" y="31" width="7.5" height="17" rx="3.75" transform="rotate(-34 48 36)" />
        {/* palm */}
        <path d="M12 37 h35.5 v7 a17.75 13.5 0 0 1 -35.5 0 Z" />
      </g>
      {/* soft shading + highlight so it reads on the sunny button */}
      <ellipse cx="30" cy="49" rx="14" ry="6" fill="#d1773b" opacity="0.35" />
      <ellipse cx="29" cy="39" rx="11" ry="5" fill="#ffd9ae" opacity="0.55" />
    </svg>
  )
}
