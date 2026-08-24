import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { VisitScreen } from '../src/screens/VisitScreen'
import { useGame } from '../src/store/game'
import { audio } from '../src/lib/audio'
import type { ModuleDef } from '../src/content/types'

const mod: ModuleDef = { id: 'visit', kind: 'visit', stars: 1, titleId: 'visit.title' }

beforeEach(() => {
  cleanup()
  localStorage.clear()
  useGame.getState().reset()
  useGame.getState().setLang('en')
  vi.spyOn(audio, 'say').mockResolvedValue()
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

test('mask tap reveals the smile underneath', async () => {
  render(<VisitScreen module={mod} onComplete={vi.fn()} />)
  expect(screen.getByTestId('drnour-mask')).toBeInTheDocument()
  await act(async () => {
    fireEvent.click(screen.getByTestId('drnour-mask'))
  })
  expect(screen.queryByTestId('drnour-mask')).toBeNull()
  expect(screen.getByTestId('drnour-smile')).toBeInTheDocument()
  expect(audio.say).toHaveBeenCalledWith('en', 'visit.maskOff')
})

test('full flow: mask → stop signal → six steps → complete, exactly once', async () => {
  vi.useFakeTimers()
  const onComplete = vi.fn()
  render(<VisitScreen module={mod} onComplete={onComplete} />)
  await act(async () => {
    fireEvent.click(screen.getByTestId('drnour-mask'))
  })
  await act(async () => {
    fireEvent.click(screen.getByTestId('raise-hand'))
  })
  expect(screen.getByTestId('paused-label')).toBeInTheDocument()
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000) // freeze ends
  })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30_000) // six steps auto-advance
  })
  for (const id of [
    'visit.step.chair',
    'visit.step.light',
    'visit.step.mirror',
    'visit.step.sleepy',
    'visit.step.count',
    'spray.count.1',
    'spray.count.2',
    'spray.count.3',
    'spray.count.4',
    'spray.count.5',
    'spray.count.6',
    'spray.count.7',
    'spray.count.8',
    'spray.count.9',
    'spray.count.10',
    'visit.step.clean',
    'visit.done',
  ])
    expect(audio.say).toHaveBeenCalledWith('en', id)
  expect(onComplete).toHaveBeenCalledTimes(1)
  // manual Next after auto-complete must not double-fire
  fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  expect(onComplete).toHaveBeenCalledTimes(1)
})

test('light glow is a slow fade, never a flash', () => {
  render(<VisitScreen module={mod} onComplete={vi.fn()} />)
  const glow = screen.getByTestId('visit-light')
  expect(Number(glow.getAttribute('data-glow-duration'))).toBeGreaterThanOrEqual(1)
})

/** Walk the whole simulation and collect the lines it spoke, in order. */
async function runSimulation() {
  render(<VisitScreen module={mod} onComplete={vi.fn()} />)
  await act(async () => {
    fireEvent.click(screen.getByTestId('drnour-mask'))
  })
  await act(async () => {
    fireEvent.click(screen.getByTestId('raise-hand'))
  })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000)
  })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30_000)
  })
  return vi.mocked(audio.say).mock.calls.map(c => c[1])
}

// Both journeys walk the same six beats. This was briefly split — the sleepy
// juice and the counting on the treatment path only — and the owner's call is
// that every child sees all six, so the test asserts that for each path rather
// than one each way.
for (const path of ['checkup', 'treatment'] as const) {
  test(`the ${path} visit walks all six steps in order`, async () => {
    vi.useFakeTimers()
    useGame.getState().setPath(path)
    const spoken = await runSimulation()

    const steps = [
      'visit.step.chair',
      'visit.step.light',
      'visit.step.mirror',
      'visit.step.sleepy',
      'visit.step.count',
      'visit.step.clean',
    ]
    for (const id of steps) expect(spoken).toContain(id)

    // Order is the part that matters clinically: the sleepy juice goes on
    // before the counting, and the handpiece only after both.
    const spokenSteps = spoken.filter(id => steps.includes(id as string))
    expect(spokenSteps).toEqual(steps)
    const countStart = spoken.indexOf('visit.step.count')
    expect(spoken.slice(countStart + 1, countStart + 11)).toEqual([
      'spray.count.1',
      'spray.count.2',
      'spray.count.3',
      'spray.count.4',
      'spray.count.5',
      'spray.count.6',
      'spray.count.7',
      'spray.count.8',
      'spray.count.9',
      'spray.count.10',
    ])
  })
}
