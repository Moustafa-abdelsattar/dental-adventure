import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { ClinicScreen } from '../src/screens/ClinicScreen'
import { useGame } from '../src/store/game'
import { audio } from '../src/lib/audio'

const module = { id: 'clinic', kind: 'clinic' as const, stars: 1, titleId: 'clinic.title' }

beforeEach(() => {
  cleanup()
  localStorage.clear()
  useGame.getState().reset()
  useGame.getState().setLang('en')
  vi.spyOn(audio, 'say').mockResolvedValue()
})
afterEach(() => vi.restoreAllMocks())

test('exploring all four objects completes the module', async () => {
  const onComplete = vi.fn()
  render(<ClinicScreen module={module} onComplete={onComplete} />)
  for (const id of ['light', 'chair', 'sink', 'table']) {
    fireEvent.click(screen.getByTestId(`hotspot-${id}`))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    })
  }
  expect(onComplete).toHaveBeenCalledTimes(1)
  expect(audio.say).toHaveBeenCalledWith('en', 'clinic.done')
})

test('fewer than four does not complete; explored badge shows', async () => {
  const onComplete = vi.fn()
  render(<ClinicScreen module={module} onComplete={onComplete} />)
  fireEvent.click(screen.getByTestId('hotspot-chair'))
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  })
  expect(screen.getByTestId('explored-chair')).toBeInTheDocument()
  expect(onComplete).not.toHaveBeenCalled()
})

test('idle 10s triggers a spoken hint', () => {
  vi.useFakeTimers()
  render(<ClinicScreen module={module} onComplete={vi.fn()} />)
  act(() => {
    vi.advanceTimersByTime(10000)
  })
  expect(audio.say).toHaveBeenCalledWith('en', 'milo.hint.tap')
  vi.useRealTimers()
})
