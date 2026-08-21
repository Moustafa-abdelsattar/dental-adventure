import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import board from '../src/content/tools-board.json'
import checkup from '../src/content/paths/checkup.json'
import treatment from '../src/content/paths/treatment.json'
import en from '../src/content/strings/en.json'
import { ModuleHost, starIdsFor } from '../src/screens/ModuleHost'
import type { ModuleRegistry, ModuleProps } from '../src/screens/registry'
import { useGame } from '../src/store/game'

const manifests = [checkup, treatment]

for (const m of manifests) {
  test(`${m.path}: star economy totals exactly 5`, () => {
    expect(m.modules.reduce((s, mod) => s + mod.stars, 0)).toBe(5)
  })

  test(`${m.path}: every titleId and tool string exists in copy`, () => {
    for (const mod of m.modules) {
      expect(en).toHaveProperty(mod.titleId)
      for (const toolId of mod.toolIds ?? [])
        for (const part of ['name', 'desc', 'fact']) expect(en).toHaveProperty(`tool.${toolId}.${part}`)
    }
  })

  test(`${m.path}: Milo's arc — every pre-visit module has a beat, the last one is the role reversal`, () => {
    const preVisit = m.modules.filter(mod => mod.kind !== 'visit')
    for (const mod of preVisit) expect(en, `module ${mod.id} needs a beatId`).toHaveProperty(mod.beatId ?? '')
    expect(preVisit[preVisit.length - 1].beatId).toBe('story.reversal')
  })
}

test('both journeys hand the tools board every cell it has, so none is left uncovered', () => {
  const ids = (m: typeof checkup) => m.modules.find(x => x.kind === 'tools')!.toolIds!
  // The board is whatever scripts/make-tools-board.mjs drew, and the rule is
  // that a journey covers all of it. An open cell beside a covered one reads to
  // a child as the one that failed to load, so this asserts the relationship
  // rather than a number — the board went from nine cells to four and the thing
  // that must stay true did not change.
  const cells = Object.keys(board.cells)
  expect(ids(checkup)).toEqual(cells)
  expect(ids(treatment)).toEqual(cells)
})

test('starIdsFor expands multi-star modules', () => {
  expect(starIdsFor({ id: 'tools', kind: 'tools', stars: 2, titleId: 'tools.title' })).toEqual(['tools', 'tools-2'])
  expect(starIdsFor({ id: 'clinic', kind: 'clinic', stars: 1, titleId: 'clinic.title' })).toEqual(['clinic'])
})

describe('ModuleHost engine', () => {
  const FakeModule = ({ module, onComplete }: ModuleProps) => (
    <button onClick={() => onComplete({ x: 10, y: 10 })}>done-{module.id}</button>
  )
  const registry: ModuleRegistry = {
    clinic: FakeModule,
    tools: FakeModule,
    'practice-brush': FakeModule,
    prepare: FakeModule,
    spray: FakeModule,
    visit: FakeModule,
  }

  beforeEach(() => {
    cleanup()
    vi.useFakeTimers()
    localStorage.clear()
    useGame.getState().reset()
    useGame.getState().setLang('en')
    useGame.getState().setPath('checkup')
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  test('walks the checkup path in order and reaches the reward screen at 5 stars', () => {
    render(<ModuleHost registry={registry} />)
    for (const id of ['clinic', 'tools', 'practice', 'visit']) {
      fireEvent.click(screen.getByText(`done-${id}`))
      act(() => vi.advanceTimersByTime(1000))
    }
    expect(useGame.getState().heroEarned).toBe(true)
    expect(screen.getByTestId('reward-screen')).toBeInTheDocument()
  })

  test('completing a module with a beat shows Milo\'s story line and tapping dismisses it', () => {
    render(<ModuleHost registry={registry} />)
    fireEvent.click(screen.getByText('done-clinic'))
    const beat = screen.getByTestId('story-beat')
    expect(beat.textContent).toContain('My wiggles are getting smaller')
    // past the moment where a tap is still the tail of the press that got here
    act(() => vi.advanceTimersByTime(600))
    fireEvent.click(beat)
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.queryByTestId('story-beat')).not.toBeInTheDocument()
  })

  test('resumes at the first incomplete module', () => {
    useGame.getState().awardStar('clinic')
    render(<ModuleHost registry={registry} />)
    expect(screen.getByText('done-tools')).toBeInTheDocument()
  })
})
