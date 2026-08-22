import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { springs, loops, wiggle, wiggleTiming } from '../motion/springs'
import { audio } from '../lib/audio'
import { t, type StringId } from '../lib/i18n'
import { useGame } from '../store/game'
import { BigTooth } from '../game/BigTooth'
import { TOOLS } from '../game/tools/tools'
import { StarBurst } from '../components/motion/StarBurst'
import { GameButton } from '../components/ui/GameButton'
import { GameStage } from '../game/GameStage'
import type { ModuleProps } from './registry'

/** How many different things Milo can say when a spot comes clean. */
const PRAISE_LINES = 4

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
  const [wrongTap, setWrongTap] = useState(0)
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
      setWrongTap(w => w + 1)
      void audio.say(lang, 'milo.hint.tap')
      return
    }
    const next = [...spotsRef.current]
    if (!next[i]) return
    next[i] = false
    spotsRef.current = next
    setSpots(next)
    if (next.some(Boolean)) {
      // A different line for every spot. This used to be `milo.great` each
      // time, so a child cleaning the tooth heard "Great job" four times over —
      // by the fourth it carries none of the warmth the first one did, and a
      // child has stopped listening well before then. Indexed by how many spots
      // have gone rather than by which one was tapped, so the four lines are
      // heard in order whichever order the spots are cleaned in.
      const cleaned = next.filter(dirty => !dirty).length
      void audio.say(lang, `milo.praise.${Math.min(cleaned, PRAISE_LINES)}` as StringId)
    } else if (!doneRef.current) {
      doneRef.current = true
      setDone(true)
      await audio.say(lang, 'practice.brush.done')
      completeOnce()
    }
  }

  return (
    <GameStage
      title={t(lang, 'practice.brush.title')}
      intro={t(lang, 'practice.brush.intro', { name: childName })}
      action={<GameButton label={t(lang, 'ui.next')} disabled={!done} onPress={completeOnce} />}
    >
      <motion.div
        key={wrongTap}
        animate={wrongTap ? wiggle : {}}
        transition={wiggleTiming}
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
        transition={brushSelected ? { rotate: loops.sway, scale: springs.snappy } : loops.breathe}
        className={`shrink-0 w-28 h-28 rounded-3xl bg-white shadow-lg p-2 ${brushSelected ? 'ring-4 ring-sunny' : ''}`}
        aria-label={t(lang, 'tool.brush.name')}
      >
        <BrushSvg demo={brushSelected} />
      </motion.button>
    </GameStage>
  )
}
