import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { audio } from '../lib/audio'
import { t } from '../lib/i18n'
import { useGame } from '../store/game'
import { ToolCard } from '../game/tools/ToolCard'
import { GameButton } from '../components/ui/GameButton'
import { ModuleFrame } from '../components/ui/ModuleFrame'
import type { ToolId } from '../game/tools/tools'
import type { ModuleProps } from './registry'

/** Chunk the roster into balanced pages of at most three (4 → 2+2, not 3+1). */
function groupsOf3(ids: ToolId[]): ToolId[][] {
  const pages = Math.ceil(ids.length / 3)
  const out: ToolId[][] = []
  let start = 0
  for (let p = 0; p < pages; p++) {
    const size = Math.ceil((ids.length - start) / (pages - p))
    out.push(ids.slice(start, start + size))
    start += size
  }
  return out
}

export function ToolsScreen({ module, onComplete }: ModuleProps) {
  const lang = useGame(s => s.lang)!
  const childName = useGame(s => s.childName)
  const roster = (module.toolIds ?? []) as ToolId[]
  const groups = groupsOf3(roster)
  const [met, setMet] = useState<Set<ToolId>>(new Set())
  const [page, setPage] = useState(0)
  const doneRef = useRef(false)

  useEffect(() => {
    void audio.say(lang, 'tools.intro')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // guarded completion so the fallback Next works even if narration hangs
  const completedRef = useRef(false)
  const completeOnce = () => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }

  const handleMet = async (toolId: ToolId) => {
    if (doneRef.current) return
    const next = new Set(met)
    const wasNew = !next.has(toolId)
    next.add(toolId)
    setMet(next)
    if (!wasNew) return

    const group = groups[page]
    const groupDone = group.every(id => next.has(id))
    const allDone = roster.every(id => next.has(id))
    if (allDone) {
      doneRef.current = true
      await audio.say(lang, 'tools.done')
      completeOnce()
    } else if (groupDone) {
      await audio.say(lang, 'tools.groupDone')
      setPage(p => Math.min(p + 1, groups.length - 1))
    }
  }

  const allMet = roster.every(id => met.has(id))

  return (
    <ModuleFrame
      title={t(lang, 'tools.title')}
      intro={t(lang, 'tools.intro', { name: childName })}
      action={<GameButton label={t(lang, 'ui.next')} disabled={!allMet} onPress={completeOnce} />}
    >
      {/* group progress: a tooth that gets shinier per finished group */}
      <div className="shrink-0 flex gap-2" data-testid="group-progress">
        {groups.map((g, i) => {
          const finished = g.every(id => met.has(id))
          return (
            <motion.img
              key={i}
              src="/art/tooth-happy.webp"
              alt=""
              draggable={false}
              animate={finished ? { scale: [1, 1.3, 1] } : {}}
              className={`w-8 select-none ${finished ? 'drop-shadow-[0_0_8px_rgba(255,212,94,0.9)]' : i === page ? 'opacity-70' : 'opacity-30 grayscale'}`}
            />
          )
        })}
      </div>

      <motion.div
        key={page}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className={`grid gap-3 w-full ${groups[page]?.length === 2 ? 'grid-cols-2 max-w-sm' : 'grid-cols-3 max-w-md'}`}
        data-testid={`tool-group-${page}`}
      >
        {groups[page]?.map((toolId, i) => (
          <ToolCard key={toolId} toolId={toolId} lang={lang} met={met.has(toolId)} onMet={id => void handleMet(id)} index={i} />
        ))}
      </motion.div>
    </ModuleFrame>
  )
}
