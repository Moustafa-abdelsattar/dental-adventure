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

test('full flow: mask → stop signal → four steps → complete, exactly once', async () => {
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
    await vi.advanceTimersByTimeAsync(6000) // four steps auto-advance
  })
  for (const id of ['visit.step.chair', 'visit.step.light', 'visit.step.mirror', 'visit.step.clean', 'visit.done'])
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

test('the treatment visit walks the sleepy juice and the counting', async () => {
  vi.useFakeTimers()
  useGame.getState().setPath('treatment')
  const spoken = await runSimulation()

  expect(spoken).toContain('visit.step.sleepy')
  expect(spoken).toContain('visit.step.count')
  // between the mirror and the handpiece, in that order — the sleepy juice goes
  // on before the counting, and the drilling only after both
  expect(spoken.indexOf('visit.step.mirror')).toBeLessThan(spoken.indexOf('visit.step.sleepy'))
  expect(spoken.indexOf('visit.step.sleepy')).toBeLessThan(spoken.indexOf('visit.step.count'))
  expect(spoken.indexOf('visit.step.count')).toBeLessThan(spoken.indexOf('visit.step.clean'))
})

test('the check-up visit never mentions the sleepy juice', async () => {
  vi.useFakeTimers()
  useGame.getState().setPath('checkup')
  const spoken = await runSimulation()

  // A child coming in for a check-up is not getting numbing gel. Showing it to
  // them teaches them to expect the wrong visit, which is the single thing this
  // whole app exists to prevent — so this is a correctness test, not a nicety.
  expect(spoken).not.toContain('visit.step.sleepy')
  expect(spoken).not.toContain('visit.step.count')
  for (const id of ['visit.step.chair', 'visit.step.light', 'visit.step.mirror', 'visit.step.clean'])
    expect(spoken).toContain(id)
})
