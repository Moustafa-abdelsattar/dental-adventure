import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { audio } from '../lib/audio'
import { t, type StringId } from '../lib/i18n'
import { useGame } from '../store/game'
import { Pop } from '../components/motion/Pop'
import { GameButton } from '../components/ui/GameButton'
import { DoneBadge } from '../components/ui/DoneBadge'
import { GameStage } from '../game/GameStage'
import { springs, loops, STAGGER } from '../motion/springs'
import type { ModuleProps } from './registry'

type ItemId = 'chair' | 'light' | 'sink' | 'table'

// four corners of the room, weighted low — small thumbs reach there
const ITEMS: { id: ItemId; nameId: StringId; descId: StringId; className: string }[] = [
  { id: 'light', nameId: 'clinic.light.name', descId: 'clinic.light.desc', className: 'top-[11%] start-[2%] w-[42%]' },
  { id: 'sink', nameId: 'clinic.sink.name', descId: 'clinic.sink.desc', className: 'top-[18%] end-[0%] w-[40%]' },
  { id: 'chair', nameId: 'clinic.chair.name', descId: 'clinic.chair.desc', className: 'bottom-[0%] start-[0%] w-[52%]' },
  { id: 'table', nameId: 'clinic.table.name', descId: 'clinic.table.desc', className: 'bottom-[5%] end-[0%] w-[40%]' },
]

const IDLE_HINT_MS = 10000

export function ClinicScreen({ onComplete }: ModuleProps) {
  const lang = useGame(s => s.lang)!
  const childName = useGame(s => s.childName)
  const [explored, setExplored] = useState<Set<ItemId>>(new Set())
  const [open, setOpen] = useState<ItemId | null>(null)
  const [hintFor, setHintFor] = useState<ItemId | null>(null)
  const doneRef = useRef(false)
  const sceneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void audio.say(lang, 'clinic.intro')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // idle nudge: after 10s without progress, Milo hints and one item pulses harder
  useEffect(() => {
    if (open || explored.size >= ITEMS.length) return
    const timer = setTimeout(() => {
      const next = ITEMS.find(i => !explored.has(i.id))
      if (next) {
        setHintFor(next.id)
        void audio.say(lang, 'milo.hint.tap')
      }
    }, IDLE_HINT_MS)
    return () => clearTimeout(timer)
  }, [open, explored, lang])

  const tapItem = (id: ItemId) => {
    setHintFor(null)
    setOpen(id)
    const item = ITEMS.find(i => i.id === id)!
    void audio.say(lang, item.descId)
  }

  // separate from the narration flow so a hung clip can't strand the child —
  // the fallback Next button can always finish a completed module
  const completedRef = useRef(false)
  const completeOnce = () => {
    if (completedRef.current) return
    completedRef.current = true
    const rect = sceneRef.current?.getBoundingClientRect()
    onComplete(rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined)
  }

  const closeCard = async () => {
    if (!open) return
    const next = new Set(explored)
    next.add(open)
    setExplored(next)
    setOpen(null)
    if (next.size === ITEMS.length && !doneRef.current) {
      doneRef.current = true
      await audio.say(lang, 'clinic.done')
      completeOnce()
    }
  }

  const openItem = open ? ITEMS.find(i => i.id === open)! : null

  return (
    <GameStage
      title={t(lang, 'clinic.title')}
      intro={t(lang, 'clinic.intro', { name: childName })}
      scene={<ClinicRoom />}
      action={<GameButton label={t(lang, 'ui.next')} disabled={explored.size < ITEMS.length} onPress={completeOnce} />}
    >
      {/* The room is the interface: four things standing in it, no frame
          around them. Corners are weighted low so small thumbs reach. */}
      <div ref={sceneRef} className="relative w-full h-full max-w-md">
        {ITEMS.map((item, idx) => {
          const isExplored = explored.has(item.id)
          return (
            <motion.button
              key={item.id}
              data-testid={`hotspot-${item.id}`}
              aria-label={t(lang, item.nameId)}
              onClick={() => tapItem(item.id)}
              initial={{ opacity: 0, scale: 0.6, y: 18 }}
              animate={
                isExplored
                  ? { opacity: 1, y: 0, scale: 1 }
                  : { opacity: 1, y: 0, scale: hintFor === item.id ? [1, 1.12, 1] : [1, 1.05, 1] }
              }
              transition={{
                opacity: { ...springs.playful, delay: 0.15 + idx * STAGGER },
                y: { ...springs.playful, delay: 0.15 + idx * STAGGER },
                scale: isExplored
                  ? springs.playful
                  : { ...(hintFor === item.id ? loops.urge : loops.breathe), delay: 0.3 + idx * STAGGER },
              }}
              className={`absolute ${item.className} aspect-square rounded-3xl flex items-center justify-center`}
            >
              <ItemSvg id={item.id} />
              {isExplored && <DoneBadge testid={`explored-${item.id}`} className="absolute top-0 end-0 w-10 h-10" />}
            </motion.button>
          )
        })}
      </div>

      {openItem && (
        <div className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-6" data-testid="zoom-card">
          <Pop className="bg-white rounded-3xl p-6 flex flex-col items-center gap-4 w-full max-w-sm shadow-2xl">
            <motion.div animate={{ rotate: [0, -3, 3, 0] }} transition={loops.sway} className="w-40" onClick={() => void audio.replayLast()}>
              <ItemSvg id={openItem.id} large />
            </motion.div>
            <h2 className="text-2xl font-bold text-center">{t(lang, openItem.nameId)}</h2>
            <p className="text-lg text-center text-ink/70 font-bold" onClick={() => void audio.replayLast()}>
              {t(lang, openItem.descId)}
            </p>
            <GameButton label={t(lang, 'ui.next')} onPress={() => void closeCard()} />
          </Pop>
        </div>
      )}
    </GameStage>
  )
}

/**
 * The room behind the four things: the lamp's pool of light spilling onto the
 * floor, and the mat they stand on. Both are soft and low-contrast on purpose
 * — scenery should make the space read as a room without competing with the
 * objects the child is meant to tap.
 */
function ClinicRoom() {
  return (
    <>
      <div className="absolute bottom-[16%] start-1/2 -translate-x-1/2 w-[88%] aspect-[2/1] rounded-[50%] bg-[radial-gradient(circle,rgba(255,244,214,0.75)_0%,rgba(255,244,214,0)_68%)]" />
      <div className="absolute bottom-[7%] start-1/2 -translate-x-1/2 w-[68%] aspect-[3/1] rounded-[50%] bg-mint/25" />
    </>
  )
}

import type { TargetAndTransition, Transition } from 'motion/react'

const itemIdle: Record<ItemId, { anim: TargetAndTransition; transition: Transition }> = {
  chair: { anim: { rotate: [-1.5, 1.5, -1.5] }, transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' } },
  light: { anim: { rotate: [-3, 3, -3] }, transition: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' } },
  sink: { anim: { y: [0, -3, 0] }, transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } },
  table: { anim: { rotate: [1.5, -1.5, 1.5] }, transition: { duration: 3.8, repeat: Infinity, ease: 'easeInOut' } },
}

function ItemSvg({ id, large = false }: { id: ItemId; large?: boolean }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: large ? 170 : '100%' }}>
      {id === 'light' && (
        <motion.div
          className="absolute inset-0 m-auto w-3/4 h-3/4 rounded-full bg-sunny/40 blur-xl"
          animate={{ opacity: [0.4, 0.85, 0.4] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <motion.img
        src={`/art/clinic-${id}.webp`}
        alt=""
        draggable={false}
        className="relative w-full object-contain select-none drop-shadow-md"
        animate={itemIdle[id].anim}
        transition={itemIdle[id].transition}
      />
    </div>
  )
}
