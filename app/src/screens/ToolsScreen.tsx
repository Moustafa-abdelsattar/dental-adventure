import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { audio } from '../lib/audio'
import { t } from '../lib/i18n'
import { useGame } from '../store/game'
import { ToolCard } from '../game/tools/ToolCard'
import type { ToolId } from '../game/tools/tools'
import type { ModuleProps } from './registry'

/** Chunk the roster into pages of three so each tool gets its moment. */
function groupsOf3(ids: ToolId[]): ToolId[][] {
  const out: ToolId[][] = []
  for (let i = 0; i < ids.length; i += 3) out.push(ids.slice(i, i + 3))
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
      onComplete()
    } else if (groupDone) {
      await audio.say(lang, 'tools.groupDone')
      setPage(p => Math.min(p + 1, groups.length - 1))
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center px-4 pb-8">
      <h1 className="text-2xl font-bold mt-2 mb-1">{t(lang, 'tools.title')}</h1>
      <p className="text-ink/60 font-bold mb-3 text-center">{t(lang, 'tools.intro', { name: childName })}</p>

      {/* group progress: a tooth that gets shinier per finished group */}
      <div className="flex gap-2 mb-4" data-testid="group-progress">
        {groups.map((g, i) => {
          const finished = g.every(id => met.has(id))
          return (
            <motion.span
              key={i}
              animate={finished ? { scale: [1, 1.3, 1] } : {}}
              className={`text-2xl ${finished ? 'drop-shadow-[0_0_8px_rgba(255,212,94,0.9)]' : i === page ? '' : 'opacity-30 grayscale'}`}
            >
              🦷
            </motion.span>
          )
        })}
      </div>

      <motion.div
        key={page}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-3 gap-3 w-full max-w-md"
        data-testid={`tool-group-${page}`}
      >
        {groups[page]?.map(toolId => (
          <ToolCard key={toolId} toolId={toolId} lang={lang} met={met.has(toolId)} onMet={id => void handleMet(id)} />
        ))}
      </motion.div>
    </div>
  )
}
