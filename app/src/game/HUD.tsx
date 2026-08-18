import { useEffect, useRef, useState } from 'react'
import { useGame, selectStarCount } from '../store/game'
import { t } from '../lib/i18n'
import { ProgressStars } from '../components/ui/ProgressStars'
import { Milo, type MiloHandle, type MiloPose } from './Milo/Milo'
import { milo } from './Milo/bus'

const CHEER_MS = 1400

/**
 * The one thing that never leaves the screen. Milo rides along on the start
 * edge so the child always has company in frame, the name sits in the middle,
 * and the star row on the end edge is the home every earned star flies to.
 *
 * Milo cheers when the count goes up — he reacts to the reward rather than
 * the tap, so the celebration lands on the moment that earned it.
 *
 * Smaller reactions arrive over the bus: a screen says what just happened and
 * this forwards it to the rig. A star is still the loudest thing he does, so
 * the celebrate pose is driven by the count and overrides whatever the bus
 * last asked for.
 */
export function HUD() {
  const count = useGame(selectStarCount)
  const lang = useGame(s => s.lang)
  const childName = useGame(s => s.childName)
  const [pose, setPose] = useState<MiloPose>('idle')
  const seen = useRef(count)
  const rig = useRef<MiloHandle>(null)

  useEffect(() => milo.onReact(state => rig.current?.trigger(state)), [])

  useEffect(() => {
    if (count <= seen.current) {
      seen.current = count
      return
    }
    seen.current = count
    setPose('celebrate')
    const timer = setTimeout(() => setPose('idle'), CHEER_MS)
    return () => clearTimeout(timer)
  }, [count])

  return (
    <div
      className="fixed top-0 inset-x-0 z-40 flex items-center px-4 py-2 bg-white/70 backdrop-blur-md rounded-b-3xl shadow-sm"
      style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))' }}
    >
      <div className="shrink-0 flex items-center" data-testid="hud-milo">
        <Milo ref={rig} pose={pose} size={32} />
      </div>
      <span className="flex-1 min-w-0 font-bold text-lg truncate mx-1.5">
        {lang ? t(lang, 'ui.hudTitle', { name: childName }) : ''}
      </span>
      <ProgressStars count={count} />
    </div>
  )
}
