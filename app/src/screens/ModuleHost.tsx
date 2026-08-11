import { useState } from 'react'
import { motion } from 'motion/react'
import checkupJson from '../content/paths/checkup.json'
import treatmentJson from '../content/paths/treatment.json'
import type { ModuleDef, PathManifest } from '../content/types'
import { useGame } from '../store/game'
import { audio } from '../lib/audio'
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
  const awardStar = useGame(s => s.awardStar)
  const [flights, setFlights] = useState<{ key: number; from: { x: number; y: number } }[]>([])

  if (!lang || !path) return null
  const manifest = manifests[path]
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
