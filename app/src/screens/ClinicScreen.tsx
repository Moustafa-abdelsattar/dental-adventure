import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { audio } from '../lib/audio'
import { t, type StringId } from '../lib/i18n'
import { useGame } from '../store/game'
import { Pop } from '../components/motion/Pop'
import { GameButton } from '../components/ui/GameButton'
import type { ModuleProps } from './registry'

type ItemId = 'chair' | 'light' | 'sink' | 'table'

const ITEMS: { id: ItemId; nameId: StringId; descId: StringId; className: string }[] = [
  { id: 'light', nameId: 'clinic.light.name', descId: 'clinic.light.desc', className: 'top-[6%] start-[12%]' },
  { id: 'chair', nameId: 'clinic.chair.name', descId: 'clinic.chair.desc', className: 'top-[34%] start-[8%]' },
  { id: 'sink', nameId: 'clinic.sink.name', descId: 'clinic.sink.desc', className: 'top-[10%] end-[10%]' },
  { id: 'table', nameId: 'clinic.table.name', descId: 'clinic.table.desc', className: 'top-[42%] end-[8%]' },
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

  const closeCard = async () => {
    if (!open) return
    const next = new Set(explored)
    next.add(open)
    setExplored(next)
    setOpen(null)
    if (next.size === ITEMS.length && !doneRef.current) {
      doneRef.current = true
      await audio.say(lang, 'clinic.done')
      const rect = sceneRef.current?.getBoundingClientRect()
      onComplete(rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined)
    }
  }

  const openItem = open ? ITEMS.find(i => i.id === open)! : null

  return (
    <div className="min-h-dvh flex flex-col items-center px-4 pb-8">
      <h1 className="text-2xl font-bold mt-2 mb-1">{t(lang, 'clinic.title')}</h1>
      <p className="text-ink/60 font-bold mb-2 text-center">{t(lang, 'clinic.intro', { name: childName })}</p>

      <div ref={sceneRef} className="relative w-full max-w-md aspect-[4/5] rounded-3xl bg-white/60 shadow-inner overflow-hidden">
        {/* room backdrop */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-sky/15" />
        {ITEMS.map(item => {
          const isExplored = explored.has(item.id)
          return (
            <motion.button
              key={item.id}
              data-testid={`hotspot-${item.id}`}
              aria-label={t(lang, item.nameId)}
              onClick={() => tapItem(item.id)}
              animate={isExplored ? { scale: 1 } : { scale: hintFor === item.id ? [1, 1.12, 1] : [1, 1.05, 1] }}
              transition={{ duration: hintFor === item.id ? 0.8 : 2, repeat: isExplored ? 0 : Infinity, ease: 'easeInOut' }}
              className={`absolute ${item.className} w-[38%] aspect-square rounded-3xl flex items-center justify-center`}
            >
              <ItemSvg id={item.id} />
              {isExplored && (
                <span className="absolute top-1 end-1 bg-mint text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold shadow" data-testid={`explored-${item.id}`}>
                  ✓
                </span>
              )}
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
    </div>
  )
}

function ItemSvg({ id, large = false }: { id: ItemId; large?: boolean }) {
  const s = large ? 150 : 90
  switch (id) {
    case 'chair':
      return (
        <svg width={s} viewBox="0 0 100 100" aria-hidden>
          <rect x="18" y="18" width="20" height="46" rx="10" fill="#7ec8f2" transform="rotate(-18 28 41)" />
          <rect x="26" y="52" width="52" height="16" rx="8" fill="#3b7fc4" />
          <rect x="44" y="66" width="10" height="18" rx="5" fill="#c9d6ea" />
          <rect x="30" y="82" width="40" height="8" rx="4" fill="#c9d6ea" />
        </svg>
      )
    case 'light':
      return (
        <svg width={s} viewBox="0 0 100 100" aria-hidden>
          <rect x="46" y="40" width="8" height="44" rx="4" fill="#c9d6ea" />
          <path d="M28 40 Q50 18 72 40 L64 48 Q50 36 36 48 Z" fill="#ffd45e" />
          <ellipse cx="50" cy="52" rx="16" ry="6" fill="#fff3c9" opacity="0.9" />
        </svg>
      )
    case 'sink':
      return (
        <svg width={s} viewBox="0 0 100 100" aria-hidden>
          <ellipse cx="50" cy="58" rx="30" ry="14" fill="#eaf3ff" stroke="#c9d6ea" strokeWidth="4" />
          <path d="M50 30 Q66 30 66 44" stroke="#7ec8f2" strokeWidth="6" fill="none" strokeLinecap="round" />
          <circle cx="66" cy="48" r="3" fill="#7ec8f2" />
          <rect x="30" y="66" width="40" height="18" rx="8" fill="#c9d6ea" />
        </svg>
      )
    case 'table':
      return (
        <svg width={s} viewBox="0 0 100 100" aria-hidden>
          <rect x="18" y="42" width="64" height="10" rx="5" fill="#8b6fd8" />
          <rect x="24" y="52" width="8" height="30" rx="4" fill="#c9d6ea" />
          <rect x="68" y="52" width="8" height="30" rx="4" fill="#c9d6ea" />
          <rect x="30" y="32" width="12" height="6" rx="3" fill="#7fd0ba" />
          <rect x="48" y="30" width="12" height="8" rx="3" fill="#f97ba9" />
          <circle cx="70" cy="35" r="4" fill="#ffd45e" />
        </svg>
      )
  }
}
