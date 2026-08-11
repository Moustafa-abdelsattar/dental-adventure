import { useState } from 'react'
import { motion } from 'motion/react'
import checkupJson from '../content/paths/checkup.json'
import treatmentJson from '../content/paths/treatment.json'
import type { ModuleDef, PathManifest } from '../content/types'
import { useGame } from '../store/game'
import { audio } from '../lib/audio'
import { t, type StringId } from '../lib/i18n'
import { StarFly } from '../components/motion/StarFly'
import { RewardScreen } from './RewardScreen'
import { defaultRegistry, type ModuleRegistry } from './registry'

const manifests: Record<string, PathManifest> = {
  checkup: checkupJson as PathManifest,
  treatment: treatmentJson as PathManifest,
}

/** Star ids a module awards: `id`, `id-2` … `id-n`. */
export function starIdsFor(m: ModuleDef): string[] {
  return Array.from({ length: m.stars }, (_, i) => (i === 0 ? m.id : `${m.id}-${i + 1}`))
}

export function ModuleHost({ registry = defaultRegistry }: { registry?: ModuleRegistry }) {
  const lang = useGame(s => s.lang)
  const path = useGame(s => s.path)
  const stars = useGame(s => s.stars)
  const freePlay = useGame(s => s.freePlay)
  const awardStar = useGame(s => s.awardStar)
  const [flights, setFlights] = useState<{ key: number; from: { x: number; y: number } }[]>([])
  const [freeChoice, setFreeChoice] = useState<string | null>(null)

  if (!lang || !path) return null
  const manifest = manifests[path]
  const finished = manifest.modules.filter(m => starIdsFor(m).every(id => stars[id]))
  const allDone = finished.length === manifest.modules.length

  // Free-play: replay any module; completing it just returns to the picker.
  if (allDone && freePlay && freeChoice === 'certificate') {
    return <RewardScreen onPlayAgain={() => setFreeChoice(null)} />
  }
  if (allDone && freePlay) {
    const chosen = manifest.modules.find(m => m.id === freeChoice)
    if (chosen) {
      const Screen = registry[chosen.kind]
      if (!Screen) return null
      return (
        <div className="pt-14">
          <Screen module={chosen} onComplete={() => setFreeChoice(null)} />
        </div>
      )
    }
    const kindArt: Record<string, string> = {
      clinic: '/art/clinic-chair.webp',
      tools: '/art/tool-mirror.webp',
      'practice-brush': '/art/tool-brush.webp',
      prepare: '/art/tool-ring.webp',
      spray: '/art/tool-spray.webp',
      visit: '/art/drnour.webp',
    }
    return (
      <div className="min-h-[calc(100dvh-3.5rem)] flex flex-col items-center justify-center gap-3 px-6 pt-14" data-testid="freeplay-picker">
        {manifest.modules.map((m, i) => (
          <motion.button
            key={m.id}
            data-testid={`freeplay-${m.id}`}
            onClick={() => setFreeChoice(m.id)}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 350, damping: 16, delay: i * 0.08 }}
            className="min-h-[72px] w-full max-w-xs rounded-3xl bg-white shadow-md text-xl font-bold flex items-center gap-4 px-5"
          >
            <img src={kindArt[m.kind]} alt="" className="w-11 h-11 object-contain select-none" draggable={false} />
            <span className="text-start">{t(lang, m.titleId as StringId)}</span>
          </motion.button>
        ))}
        <motion.button
          data-testid="freeplay-certificate"
          onClick={() => setFreeChoice('certificate')}
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 350, damping: 16, delay: manifest.modules.length * 0.08 }}
          className="min-h-[72px] w-full max-w-xs rounded-3xl bg-sunny text-white shadow-md text-xl font-bold flex items-center gap-4 px-5"
        >
          <img src="/art/milo-celebrate.webp" alt="" className="w-11 h-11 object-contain select-none" draggable={false} />
          <span className="text-start">{t(lang, 'ui.certificate')}</span>
        </motion.button>
      </div>
    )
  }

  const current = manifest.modules.find(m => !starIdsFor(m).every(id => stars[id]))

  if (!current) return <RewardScreen />

  const Screen = registry[current.kind]
  if (!Screen) return null

  const handleComplete = (origin?: { x: number; y: number }) => {
    void audio.say(lang, 'milo.starEarned')
    const from = origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    starIdsFor(current).forEach((id, i) => {
      setTimeout(() => {
        setFlights(f => [...f, { key: Date.now() + i, from }])
        awardStar(id)
      }, i * 300)
    })
  }

  return (
    <div className="pt-14">
      <motion.div
        key={current.id}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Screen module={current} onComplete={handleComplete} />
      </motion.div>
      {flights.map(f => (
        <StarFly key={f.key} from={f.from} onArrive={() => setFlights(fl => fl.filter(x => x.key !== f.key))} />
      ))}
    </div>
  )
}
