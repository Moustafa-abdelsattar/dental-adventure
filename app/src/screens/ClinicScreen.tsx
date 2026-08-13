import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { audio } from '../lib/audio'
import { t, type StringId } from '../lib/i18n'
import { useGame } from '../store/game'
import { Pop } from '../components/motion/Pop'
import { GameButton } from '../components/ui/GameButton'
import { DoneBadge } from '../components/ui/DoneBadge'
import { ModuleFrame } from '../components/ui/ModuleFrame'
import type { ModuleProps } from './registry'

type ItemId = 'chair' | 'light' | 'sink' | 'table'

// four corners of the room, weighted low — small thumbs reach there
const ITEMS: { id: ItemId; nameId: StringId; descId: StringId; className: string }[] = [
  { id: 'light', nameId: 'clinic.light.name', descId: 'clinic.light.desc', className: 'top-[6%] start-[7%] w-[42%]' },
  { id: 'sink', nameId: 'clinic.sink.name', descId: 'clinic.sink.desc', className: 'top-[8%] end-[5%] w-[44%]' },
  { id: 'chair', nameId: 'clinic.chair.name', descId: 'clinic.chair.desc', className: 'bottom-[5%] start-[4%] w-[47%]' },
  { id: 'table', nameId: 'clinic.table.name', descId: 'clinic.table.desc', className: 'bottom-[4%] end-[4%] w-[44%]' },
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
    <ModuleFrame
      title={t(lang, 'clinic.title')}
      intro={t(lang, 'clinic.intro', { name: childName })}
      action={<GameButton label={t(lang, 'ui.next')} disabled={explored.size < ITEMS.length} onPress={completeOnce} />}
    >
      <div ref={sceneRef} className="relative w-full max-w-md aspect-[4/5] rounded-3xl shadow-inner overflow-hidden bg-gradient-to-b from-sky/25 via-white/70 to-mint/20">
        {/* room: wall line + floor */}
        <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-b from-sky/10 to-sky/25 rounded-t-[40%_18px]" />
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
                opacity: { ...{ type: 'spring', stiffness: 350, damping: 16 }, delay: 0.15 + idx * 0.12 },
                y: { type: 'spring', stiffness: 350, damping: 16, delay: 0.15 + idx * 0.12 },
                scale: isExplored
                  ? { type: 'spring', stiffness: 350, damping: 16 }
                  : { duration: hintFor === item.id ? 0.8 : 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 + idx * 0.12 },
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
            <motion.div animate={{ rotate: [0, -3, 3, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} className="w-40" onClick={() => void audio.replayLast()}>
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
    </ModuleFrame>
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
