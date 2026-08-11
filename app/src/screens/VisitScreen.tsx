import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { audio } from '../lib/audio'
import { t, type StringId } from '../lib/i18n'
import { useGame } from '../store/game'
import { DrNour } from '../game/drnour/DrNour'
import { toolPalette as P } from '../game/tools/palette'
import { Sparkle } from '../game/Sparkle'
import { GameButton } from '../components/ui/GameButton'
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
    <div className="min-h-dvh flex flex-col items-center px-4 pb-8">
      <h1 className="text-2xl font-bold mt-2 mb-3">{t(lang, 'visit.title')}</h1>

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
        <svg viewBox="0 0 100 40" className="absolute top-2 start-1/2 -translate-x-1/2 w-24" aria-hidden>
          <rect x="46" y="0" width="8" height="12" rx="4" fill={P.metal} />
          <path d="M30 12 Q50 2 70 12 L64 20 Q50 12 36 20 Z" fill={P.sparkle} />
        </svg>

        {/* peer child reclining on the chair */}
        <svg viewBox="0 0 220 150" className="absolute bottom-4 w-[90%]" aria-hidden data-testid="peer-child">
          <rect x="20" y="78" width="150" height="26" rx="13" fill="#7ec8f2" transform="rotate(-8 95 91)" />
          <rect x="60" y="104" width="80" height="16" rx="8" fill="#3b7fc4" />
          <rect x="90" y="118" width="14" height="22" rx="7" fill={P.metal} />
          <circle cx="46" cy="64" r="20" fill="#f5c29e" />
          <path d="M28 58 C28 42 38 36 46 36 C54 36 64 42 64 58 C64 50 56 46 46 46 C36 46 28 50 28 58 Z" fill="#3d2f26" />
          <circle cx="40" cy="62" r="2.5" fill="#3a3560" />
          <circle cx="52" cy="62" r="2.5" fill="#3a3560" />
          <path d="M40 70 q6 5 12 0" stroke="#3a3560" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <rect x="62" y="70" width="86" height="22" rx="11" fill="#7fd0ba" transform="rotate(-8 105 81)" />
          {phase === 'steps' && step >= 2 && (
            <motion.g initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }} data-testid="mirror-near">
              <rect x="78" y="30" width="4" height="22" rx="2" fill={P.metal} />
              <circle cx="80" cy="24" r="9" fill={P.body} stroke={P.outline} strokeWidth="2" />
            </motion.g>
          )}
          {phase === 'steps' && step >= 3 && (
            <g data-testid="clean-sparkles">
              <Sparkle x={46} y={44} size={5} />
              <Sparkle x={60} y={54} delay={0.4} size={4} />
            </g>
          )}
        </svg>

        <div className="absolute bottom-2 end-2">
          <DrNour masked={masked} onMaskTap={() => void maskTap()} idle={!frozen} size={130} />
        </div>
      </div>

      <p className="text-ink/70 font-bold text-center mt-3 min-h-12" onClick={() => void audio.replayLast()}>
        {phase === 'meet' && t(lang, masked ? 'visit.meetDr' : 'visit.maskOff')}
        {phase === 'stop' && t(lang, 'visit.stopSignal')}
        {phase === 'steps' && step >= 0 && t(lang, STEPS[step].stringId)}
        {phase === 'done' && t(lang, 'visit.done')}
      </p>

      {phase === 'stop' && (
        <motion.button
          data-testid="raise-hand"
          onClick={handTap}
          animate={frozen ? { scale: 1 } : { scale: [1, 1.1, 1] }}
          transition={{ duration: 1.2, repeat: frozen ? 0 : Infinity }}
          className="mt-2 w-24 h-24 rounded-full bg-sunny text-5xl shadow-lg"
          aria-label="raise hand"
        >
          ✋
        </motion.button>
      )}
      {frozen && (
        <p className="mt-2 text-grape font-bold text-lg" data-testid="paused-label">
          ⏸
        </p>
      )}

      {phase === 'steps' && (
        <div className="flex gap-2 mt-2" aria-hidden>
          {STEPS.map((s, i) => (
            <span key={s.id} className={`w-3 h-3 rounded-full ${i <= step ? 'bg-grape' : 'bg-grape/20'}`} />
          ))}
        </div>
      )}
      {phase === 'done' && <GameButton label={t(lang, 'ui.next')} onPress={completeOnce} />}
    </div>
  )
}
