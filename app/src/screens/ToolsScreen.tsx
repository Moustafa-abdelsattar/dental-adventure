import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { audio } from '../lib/audio'
import { t, type StringId } from '../lib/i18n'
import { useGame } from '../store/game'
import { Pop } from '../components/motion/Pop'
import { StarBurst } from '../components/motion/StarBurst'
import { DoneBadge } from '../components/ui/DoneBadge'
import { GameButton } from '../components/ui/GameButton'
import { GameStage } from '../game/GameStage'
import { ScratchCell } from '../game/tools/ScratchCell'
import { milo } from '../game/Milo/bus'
import { loops, STAGGER } from '../motion/springs'
import board from '../content/tools-board.json'
import type { ToolId } from '../game/tools/tools'
import type { ModuleProps } from './registry'

/**
 * The tools board — nine instruments in nine cells, each one hidden under a
 * cover a child scratches away.
 *
 * The screen used to be a grid of white cards on a pastel background. It is now
 * the client's board, and finding a tool is something the child does with their
 * finger rather than something that happens when they press a button.
 *
 * Every cell on the board is covered, on both journeys. A half-scratched board
 * reads as broken to a child — the open cells look like the ones that failed to
 * load — so a check-up now meets all nine instruments too, and the board is
 * either all foil or all found.
 */

const CELLS = board.cells as Record<ToolId, { left: number; top: number; width: number; height: number }>

export function ToolsScreen({ module, onComplete }: ModuleProps) {
  const lang = useGame(s => s.lang)!
  const childName = useGame(s => s.childName)
  const roster = (module.toolIds ?? []) as ToolId[]
  const [met, setMet] = useState<Set<ToolId>>(new Set())
  const [open, setOpen] = useState<ToolId | null>(null)
  const [burstFor, setBurstFor] = useState<ToolId | null>(null)
  const doneRef = useRef(false)
  const burstTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    void audio.say(lang, 'tools.intro')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => clearTimeout(burstTimer.current), [])

  const completedRef = useRef(false)
  const completeOnce = () => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }

  /** A cover has come away: show the tool and tell the child about it. */
  const reveal = (toolId: ToolId) => {
    if (met.has(toolId) || open) return
    milo.react('happy')
    setBurstFor(toolId)
    burstTimer.current = setTimeout(() => setBurstFor(null), 900)
    setOpen(toolId)
    // One line, not two. The fun fact used to play straight after the
    // description, so a child met each of the nine tools by listening to two
    // sentences about it — in Arabic that is a long time to hold a four-year-old
    // still before the next cover can be scratched. The clip and the string are
    // both still there if it is ever wanted back.
    void audio.say(lang, `tool.${toolId}.desc` as StringId)
  }

  const closeCard = async () => {
    if (!open) return
    const justMet = open
    const next = new Set(met)
    next.add(justMet)
    setMet(next)
    setOpen(null)
    if (roster.every(id => next.has(id)) && !doneRef.current) {
      doneRef.current = true
      await audio.say(lang, 'tools.done')
      completeOnce()
    }
  }

  const allMet = roster.every(id => met.has(id))
  const openTool = open

  return (
    <>
      <GameStage
        title={t(lang, 'tools.title')}
        intro={t(lang, 'tools.intro', { name: childName })}
        scene={
          <img
            src="/art/tools-board-bg.webp"
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover select-none"
          />
        }
        action={<GameButton label={t(lang, 'ui.next')} disabled={!allMet} onPress={completeOnce} />}
      >
        <div
          data-testid="tools-board"
          className="relative w-full max-h-full"
          style={{ aspectRatio: `${board.board.width} / ${board.board.height}` }}
        >
          <img
            src="/art/tools-board.webp"
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain select-none"
          />

          {roster.map((toolId, i) => {
            const cell = CELLS[toolId]
            if (!cell) return null
            const style = {
              left: `${cell.left}%`,
              top: `${cell.top}%`,
              width: `${cell.width}%`,
              height: `${cell.height}%`,
            }
            const isMet = met.has(toolId)
            return (
              <div key={toolId} className="contents">
                {!isMet && (
                  <>
                    <ScratchCell
                      testid={`tool-${toolId}`}
                      label={t(lang, `tool.${toolId}.name` as StringId)}
                      onRevealed={() => reveal(toolId)}
                      style={style}
                      // by position on the board, not by position in this
                      // journey's roster, so a cell keeps its foil whichever
                      // visit type the child is playing
                      variant={board.order.indexOf(toolId)}
                      disabled={!!open}
                    />
                    {/* the cover carries its own position; the marker sits on it */}
                    <span className="absolute pointer-events-none" style={style}>
                      <ScratchHint idx={i} />
                    </span>
                  </>
                )}
                {isMet && (
                  <span className="absolute pointer-events-none" style={style}>
                    <DoneBadge testid={`met-${toolId}`} className="absolute top-0 end-0 w-7 h-7" />
                    {burstFor === toolId && <StarBurst show size={54} />}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </GameStage>

      {/* Outside the stage on purpose. The stage's own layers are a stacking
          context — the caption floats above the subject — and a card rendered
          inside the subject cannot climb over the title however high its z
          goes. Hoisted here, it covers the whole screen, which is what a card
          a child has to dismiss should do. */}
      {openTool && (
        <div
          className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-6"
          data-testid="zoom-card"
        >
          <Pop className="bg-white rounded-3xl p-6 flex flex-col items-center gap-3 w-full max-w-sm shadow-2xl">
            {/* The instruments stand, so the box is tall. It used to be a
                shallow landscape strip, back when each one lay along its cell —
                these are upright and a wide short box shrank them to a third of
                the size the card could give them. */}
            <img
              src={`/art/tool-${openTool}.webp`}
              alt=""
              draggable={false}
              className="w-full h-56 object-contain select-none"
              onClick={() => void audio.replayLast()}
            />
            <h2 className="text-2xl font-bold text-center">{t(lang, `tool.${openTool}.name` as StringId)}</h2>
            {/* The tool says one thing about itself. The second paragraph under
                this one carried the fun fact, which made every card in the set
                a wall of text a non-reading child cannot skim — and the clinic
                cards, which have always been name-plus-a-line, looked nothing
                like it. */}
            <p className="text-lg text-center text-ink/70 font-bold" onClick={() => void audio.replayLast()}>
              {t(lang, `tool.${openTool}.desc` as StringId)}
            </p>
            <GameButton label={t(lang, 'ui.next')} onPress={() => void closeCard()} />
          </Pop>
        </div>
      )}
    </>
  )
}

/**
 * "Scratch here." Sits on an unopened cover so a child knows it comes off.
 *
 * It rubs rather than pulses. A dot breathing in place says press me, and
 * pressing is the one thing that will not take this cover off — the marker has
 * to show the gesture the cell wants, because a four-year-old copies what they
 * see long before they work anything out.
 */
function ScratchHint({ idx }: { idx: number }) {
  return (
    <motion.span
      aria-hidden
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/85 border-2 border-sunny shadow-[0_2px_6px_rgba(58,53,96,0.3)]"
      animate={{ x: [-10, 10, -10], scale: [1, 1.12, 1], opacity: [0.75, 1, 0.75] }}
      transition={{ ...loops.breathe, delay: idx * STAGGER }}
    />
  )
}
