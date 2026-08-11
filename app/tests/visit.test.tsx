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
