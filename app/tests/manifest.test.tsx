import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
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

test('checkup teaches only the four essential tools; treatment carries the rest', () => {
  const ids = (m: typeof checkup) => m.modules.find(x => x.kind === 'tools')!.toolIds!
  expect(ids(checkup)).toEqual(['mirror', 'suction', 'syringe', 'brush'])
  expect(ids(treatment)).toEqual(expect.arrayContaining(['ring', 'umbrella', 'spray']))
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
