import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { audio } from '../lib/audio'
import { t, type StringId } from '../lib/i18n'
import { useGame } from '../store/game'
import { DrNour } from '../game/drnour/DrNour'
import { GameButton } from '../components/ui/GameButton'
import { GameStage } from '../game/GameStage'
import { loops } from '../motion/springs'
import type { ModuleProps } from './registry'

type Phase = 'meet' | 'stop' | 'steps' | 'done'

/** The shared canvas `scripts/import-visit-steps.mjs` aligns every frame onto. */
const ART_W = 820
const ART_H = 1168

/** Every cut frame, all on that one canvas. */
const FRAMES = ['chair', 'light', 'mirror', 'sleepy', 'count', 'count-ten', 'clean', 'hand'] as const
type Frame = (typeof FRAMES)[number]

interface Step {
  id: string
  stringId: StringId
  frame: Frame
  /** Swapped in once the line has finished, for a beat that has two moments. */
  thenFrame?: Frame
  /** Overrides `STEP_PAUSE_MS` where the picture needs longer to be read. */
  pauseMs?: number
}

/**
 * The whole visit, in order, for every child.
 *
 * The sleepy juice and the counting were briefly shown only on the treatment
 * journey, on the reasoning that a check-up child shown numbing gel would learn
 * to expect something they were not going to be given. The owner's call is that
 * every child sees all six, so both journeys run this one list. To put the
 * split back, branch on `useGame(s => s.path)` here and restore the two tests
 * in `visit.test.tsx` that assert each direction.
 *
 * The counting beat holds on two frames — eyes shut mid-count, then both hands
 * up on ten — so the pause while a child actually counts has something moving
 * in it rather than a still picture waiting them out.
 */
const STEPS: Step[] = [
  { id: 'chair', stringId: 'visit.step.chair', frame: 'chair' },
  { id: 'light', stringId: 'visit.step.light', frame: 'light' },
  { id: 'mirror', stringId: 'visit.step.mirror', frame: 'mirror' },
  { id: 'sleepy', stringId: 'visit.step.sleepy', frame: 'sleepy' },
  { id: 'count', stringId: 'visit.step.count', frame: 'count', thenFrame: 'count-ten', pauseMs: 2200 },
  { id: 'clean', stringId: 'visit.step.clean', frame: 'clean' },
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
  /** True once the current step's line has finished, for `thenFrame`. */
  const [lineDone, setLineDone] = useState(false)
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
        setLineDone(false)
        await audio.say(lang, STEPS[i].stringId)
        setLineDone(true)
        await new Promise(r => setTimeout(r, STEPS[i].pauseMs ?? STEP_PAUSE_MS))
      }
      setPhase('done')
      await audio.say(lang, 'visit.done')
      completeOnce()
    }
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Which frame is on screen. The stop signal gets the boy with his hand up, so
  // the child sees the thing they are being asked to do rather than only a
  // button offering it.
  const current = step >= 0 ? STEPS[step] : undefined
  const art: Frame =
    phase === 'meet'
      ? 'chair'
      : phase === 'stop'
        ? 'hand'
        : phase === 'done'
          ? 'clean'
          : !current
            ? 'chair'
            : ((lineDone && current.thenFrame) || current.frame)

  return (
    <GameStage
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
      scene={
        <>
          {/* The room the child has already explored, thrown out of focus.
              Every other module hands `GameStage` a scene; this one used to
              hand it nothing and played the climax of the whole game against
              the bare sky-and-clouds default. The blurred plate puts the visit
              back indoors without competing with the two figures in front of
              it — it is depth, not detail. */}
          <img
            src="/art/clinic-room-bg.webp"
            alt=""
            draggable={false}
            data-testid="visit-room-bg"
            className="absolute inset-0 w-full h-full object-cover select-none scale-105"
          />
          {/* Warm wash so the caption stays readable at the top and the figures
              read as lit from above rather than pasted on. */}
          <div className="absolute inset-0 bg-gradient-to-b from-cream/85 via-cream/25 to-cream/55" />
          {/* The floor they stand on. The plate's own floor is a blur; this is
              the line that tells a child the chair is resting on something. */}
          <div className="absolute inset-x-[-12%] bottom-0 h-[30%] rounded-t-[50%/26%] bg-gradient-to-b from-[#e6f3fb] via-[#cfe6f5] to-[#b7d8ee] [mask-image:linear-gradient(to_bottom,transparent_0%,black_22%)]" />
        </>
      }
      effects={
        // The overhead light coming on — a slow warm bloom, deliberately no
        // flash. It lives on the stage's effects layer rather than inside the
        // artwork's box: a linear wash in there was exactly as wide as the
        // frames and its two vertical edges drew a visible rectangle across the
        // room. A radial falloff over the whole stage has no edges to see.
        <motion.div
          data-testid="visit-light"
          data-glow-duration="1.2"
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 65% at 50% 6%, rgba(255,209,102,0.55) 0%, rgba(255,209,102,0.22) 38%, rgba(255,209,102,0) 72%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'steps' && step >= 1 && !frozen ? 1 : 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
      }
    >
      {/* The treatment room, not a picture of one: the child and Dr. Nour stand
          on one floor line with the lamp directly over the chair.

          The group is bottom-anchored *above* the action row rather than at the
          foot of the stage. Sitting it on the very bottom edge cropped the base
          of the chair and left the Next button lying across Dr. Nour's face. */}
      <div
        data-testid="visit-scene"
        className="absolute inset-x-0 top-[22%] bottom-[10%] flex items-end justify-center px-2"
      >
        {/* The box carries the frames' own aspect ratio and is driven by
            height, not width. Sized by width it stood taller than the space it
            was given, so the boy overflowed the stage at nearly twice the size
            he should be and Dr. Nour beside him looked doll-sized. Matching the
            ratio also means every percentage below is a coordinate in the
            artwork itself. */}
        <div className="relative h-full max-w-full" style={{ aspectRatio: `${ART_W} / ${ART_H}` }}>
          {/* The walkthrough itself.
              All five frames are cut from the same render and aligned on one
              shared canvas by `scripts/import-visit-steps.mjs`, so they stack
              exactly and a cross-fade between any two reads as the room
              changing rather than the picture being swapped. That is the whole
              reason they are absolutely positioned on top of each other instead
              of being one <img> with a changing `src`. */}
          <div className="absolute inset-0 grid" data-testid="peer-child">
            {FRAMES.map(frame => (
              <motion.img
                key={frame}
                src={`/art/visit-step-${frame}.webp`}
                alt=""
                draggable={false}
                data-testid={`visit-frame-${frame}`}
                data-active={frame === art || undefined}
                className="w-full h-full object-contain select-none drop-shadow-lg [grid-area:1/1]"
                initial={false}
                animate={{ opacity: phase !== 'meet' && frame === art ? 1 : 0 }}
                transition={{ duration: 0.45, ease: 'easeInOut' }}
              />
            ))}
          </div>

          {/* Dr. Nour has the meeting to herself.
              She is drawn as a small-headed full figure; the walkthrough frames
              are a tight crop on the boy with a big-headed dentist leaning in
              painted into them. The two framings cannot share a floor — stood
              beside the chair she reads as doll-sized, and scaled to match his
              head she covers him. So this beat is hers alone, which is what the
              line asks for anyway ("This is Dr. Nour — tap the mask"), and the
              chair frames take the stage from the stop signal onward. */}
          <motion.div
            className="absolute bottom-[4%] start-1/2 -translate-x-1/2 w-[62%]"
            initial={false}
            animate={{ opacity: phase === 'meet' ? 1 : 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            style={{ pointerEvents: phase === 'meet' ? undefined : 'none' }}
          >
            <DrNour masked={masked} onMaskTap={() => void maskTap()} idle={!frozen} />
          </motion.div>
        </div>
      </div>

      {/* The three overlays below are placed against the stage rather than left
          to the subject layer's flex flow, which centred them in the middle of
          the room and dropped the step dots on the very bottom edge. */}
      {phase === 'stop' && (
        <motion.button
          data-testid="raise-hand"
          onClick={handTap}
          animate={frozen ? { scale: 1 } : { scale: [1, 1.1, 1] }}
          transition={frozen ? { duration: 0.3 } : loops.breathe}
          className="absolute bottom-[13%] start-1/2 -translate-x-1/2 z-10 w-24 h-24 rounded-full bg-sunny shadow-xl ring-4 ring-white/70 flex items-center justify-center"
          aria-label="raise hand"
        >
          <RaisedHand className="w-14" />
        </motion.button>
      )}
      {frozen && (
        <svg
          viewBox="0 0 24 24"
          className="absolute bottom-[30%] start-1/2 -translate-x-1/2 z-10 w-10 h-10 drop-shadow"
          data-testid="paused-label"
          aria-label="paused"
        >
          <rect x="5" y="4" width="5" height="16" rx="2.5" fill="#8b6fd8" />
          <rect x="14" y="4" width="5" height="16" rx="2.5" fill="#8b6fd8" />
        </svg>
      )}

      {phase === 'steps' && (
        <div className="absolute bottom-[12%] start-1/2 -translate-x-1/2 z-10 flex gap-2" aria-hidden>
          {STEPS.map((s, i) => (
            <span
              key={s.id}
              className={`w-3 h-3 rounded-full transition-colors ${i <= step ? 'bg-grape' : 'bg-grape/25'}`}
            />
          ))}
        </div>
      )}
    </GameStage>
  )
}

/**
 * An open palm, held up: the stop signal the child is being taught.
 *
 * Drawn to survive being 56 pixels wide, which is the only size it is ever
 * shown at. The version before this one set the four fingers barely a unit and
 * a half apart, so at that size the gaps closed and the hand became one orange
 * slab; a shadow ellipse and a highlight ellipse laid over the palm turned the
 * middle of it to mud; and the thumb was pinned outside the palm, where it read
 * as a stray blob rather than part of the hand.
 *
 * So: fingers a clear 2.8 units apart, no shading at all, and the thumb rotated
 * about a pivot inside the palm so it grows out of it.
 *
 * White rather than a skin tone. It has the most contrast on the sunny button
 * of anything tried, it matches the white the rest of the interface uses for
 * controls — and a hand that stands for *this* child's hand is better off not
 * picking a colour for it.
 */
function RaisedHand({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <g fill="#fffdf7">
        {/* pinky, ring, middle, index */}
        <rect x="7" y="26" width="6.6" height="20" rx="3.3" />
        <rect x="16.4" y="19" width="6.6" height="27" rx="3.3" />
        <rect x="25.8" y="16" width="6.6" height="30" rx="3.3" />
        <rect x="35.2" y="20" width="6.6" height="26" rx="3.3" />
        {/* thumb — pivot sits inside the palm so the two read as one hand */}
        <rect x="36.5" y="31" width="6.6" height="17" rx="3.3" transform="rotate(40 39.8 48)" />
        <rect x="7" y="34" width="34.8" height="19" rx="9.5" />
      </g>
    </svg>
  )
}
