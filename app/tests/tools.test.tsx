import { render, screen, fireEvent, act, cleanup, within } from '@testing-library/react'
import { TOOLS, type ToolId } from '../src/game/tools/tools'
import { ToolsScreen } from '../src/screens/ToolsScreen'
import { useGame } from '../src/store/game'
import { audio } from '../src/lib/audio'
import checkup from '../src/content/paths/checkup.json'
import treatment from '../src/content/paths/treatment.json'
import board from '../src/content/tools-board.json'
import type { ModuleDef } from '../src/content/types'

/** Every instrument the board has a cell for — not a list that has to be kept
 *  in step with it by hand. */
const ALL_IDS = Object.keys(board.cells) as ToolId[]

beforeEach(() => {
  cleanup()
  localStorage.clear()
  useGame.getState().reset()
  useGame.getState().setLang('en')
  vi.spyOn(audio, 'say').mockResolvedValue()
})
afterEach(() => vi.restoreAllMocks())

test('every tool id has an entry and renders its art asset', () => {
  for (const id of ALL_IDS) {
    const { Svg } = TOOLS[id]
    const { container, unmount } = render(<Svg />)
    const img = container.querySelector('img')
    expect(img, `tool ${id} must render its art image`).toBeTruthy()
    expect(img!.getAttribute('src')).toBe(`/art/tool-${id}.webp`)
    unmount()
  }
})

/**
 * Scratch one cell open.
 *
 * jsdom has no 2D canvas context, so the cover cannot actually be rubbed away
 * here — `ScratchCell` falls back to opening on a tap, which is the same escape
 * hatch a child who will not scratch gets. The scratching itself is exercised
 * in a real browser.
 */
async function scratch(id: ToolId) {
  await finishIntro()
  await act(async () => {
    const cell = screen.getByTestId(`tool-${id}`)
    fireEvent.pointerDown(cell, { clientX: 10, clientY: 10 })
    fireEvent.pointerUp(cell, { clientX: 10, clientY: 10 })
  })
}

async function finishIntro() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

async function dismiss() {
  await act(async () => {
    await Promise.resolve()
    fireEvent.click(within(screen.getByTestId('zoom-card')).getByRole('button', { name: 'Next' }))
  })
}

async function meetAll(roster: ToolId[]) {
  for (const id of roster) {
    await scratch(id)
    await dismiss()
  }
}

test('every cell on the board is covered, on either journey', () => {
  for (const path of [checkup, treatment]) {
    const module = path.modules.find(m => m.kind === 'tools')! as ModuleDef
    const { unmount } = render(<ToolsScreen module={module} onComplete={vi.fn()} />)
    // a board with some cells already open reads as half-loaded, not as a game
    for (const id of ALL_IDS) expect(screen.getByTestId(`tool-${id}`)).toBeInTheDocument()
    unmount()
  }
})

test('every cover is placed from the measured board, not from hand-tuned numbers', () => {
  const module = treatment.modules.find(m => m.kind === 'tools')! as ModuleDef
  render(<ToolsScreen module={module} onComplete={vi.fn()} />)
  for (const id of ALL_IDS) {
    const cell = board.cells[id as keyof typeof board.cells]
    const el = screen.getByTestId(`tool-${id}`)
    expect(el.style.left).toBe(`${cell.left}%`)
    expect(el.style.top).toBe(`${cell.top}%`)
    expect(el.style.width).toBe(`${cell.width}%`)
    expect(el.style.height).toBe(`${cell.height}%`)
  }
})

test('Arabic phase two plays start and scratch instructions before cells open', async () => {
  useGame.getState().setLang('ar')
  const say = vi.mocked(audio.say)
  const spoken: string[] = []
  let finishStart!: () => void
  let finishScratch!: () => void
  say.mockImplementation((_lang, id) => {
    spoken.push(id)
    if (id === 'tools.title') return new Promise<void>(resolve => (finishStart = resolve))
    if (id === 'tools.intro') return new Promise<void>(resolve => (finishScratch = resolve))
    return Promise.resolve()
  })

  const module = checkup.modules.find(m => m.kind === 'tools')! as ModuleDef
  render(<ToolsScreen module={module} onComplete={vi.fn()} />)
  const mirror = screen.getByTestId('tool-mirror')

  expect(spoken).toEqual(['tools.title'])
  expect(mirror).toHaveAttribute('aria-disabled', 'true')
  fireEvent.pointerDown(mirror, { clientX: 10, clientY: 10 })
  fireEvent.pointerUp(mirror, { clientX: 10, clientY: 10 })
  expect(screen.queryByTestId('zoom-card')).toBeNull()

  await act(async () => {
    finishStart()
    await Promise.resolve()
  })

  expect(spoken).toEqual(['tools.title', 'tools.intro'])
  expect(mirror).toHaveAttribute('aria-disabled', 'true')

  await act(async () => {
    finishScratch()
  })

  expect(mirror).toHaveAttribute('aria-disabled', 'false')
})

test('scratching a cell reveals the tool, narrates one line about it, and marks it met', async () => {
  const module = checkup.modules.find(m => m.kind === 'tools')! as ModuleDef
  render(<ToolsScreen module={module} onComplete={vi.fn()} />)

  await scratch('mirror')
  const card = screen.getByTestId('zoom-card')
  expect(within(card).getByText('Dental Mirror')).toBeInTheDocument()
  expect(audio.say).toHaveBeenCalledWith('en', 'tool.mirror.desc')

  // One line per tool, not two. The fun fact used to be spoken straight after
  // the description and printed under it, which meant meeting every tool
  // took two sentences each. The string and its clip still exist; nothing should
  // be playing or printing them.
  expect(audio.say).not.toHaveBeenCalledWith('en', 'tool.mirror.fact')
  expect(within(card).queryByText(/smooth and cool/i)).not.toBeInTheDocument()

  await dismiss()
  expect(screen.getByTestId('met-mirror')).toBeInTheDocument()
  // a met cell has no cover left to scratch
  expect(screen.queryByTestId('tool-mirror')).not.toBeInTheDocument()
})

test('tool card cannot advance until its narration finishes', async () => {
  const say = vi.mocked(audio.say)
  let finishNarration!: () => void
  say.mockImplementation((_lang, id) =>
    id === 'tool.mirror.desc' ? new Promise<void>(resolve => (finishNarration = resolve)) : Promise.resolve(),
  )

  const module = checkup.modules.find(m => m.kind === 'tools')! as ModuleDef
  render(<ToolsScreen module={module} onComplete={vi.fn()} />)
  await scratch('mirror')

  const next = within(screen.getByTestId('zoom-card')).getByRole('button', { name: 'Next' })
  expect(next).toBeDisabled()

  await act(async () => {
    finishNarration()
  })

  expect(next).not.toBeDisabled()
})

test('the module completes once every tool on the roster has been found', async () => {
  const module = treatment.modules.find(m => m.kind === 'tools')! as ModuleDef
  const roster = module.toolIds! as ToolId[]
  const onComplete = vi.fn()
  render(<ToolsScreen module={module} onComplete={onComplete} />)

  expect(roster).toEqual(ALL_IDS)
  await meetAll(roster)
  expect(onComplete).toHaveBeenCalledTimes(1)
  expect(audio.say).toHaveBeenCalledWith('en', 'tools.done')
})

test('fallback Next is disabled until every tool is met, then completes exactly once', async () => {
  const module = checkup.modules.find(m => m.kind === 'tools')! as ModuleDef
  const onComplete = vi.fn()
  render(<ToolsScreen module={module} onComplete={onComplete} />)
  const next = screen.getByTestId('next-fallback').querySelector('button')!
  expect(next).toBeDisabled()
  fireEvent.click(next)
  expect(onComplete).not.toHaveBeenCalled()
  await meetAll(module.toolIds! as ToolId[])
  expect(next).toBeEnabled()
  fireEvent.click(next) // the auto path already completed; the guard must swallow this
  expect(onComplete).toHaveBeenCalledTimes(1)
})
