import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { PracticeBrushScreen } from '../src/screens/PracticeBrushScreen'
import { PrepareScreen } from '../src/screens/PrepareScreen'
import { SprayScreen } from '../src/screens/SprayScreen'
import { useGame } from '../src/store/game'
import { audio } from '../src/lib/audio'
import type { ModuleDef } from '../src/content/types'

const mod = (id: string): ModuleDef => ({ id, kind: 'practice-brush', stars: 1, titleId: 'practice.brush.title' })

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

test('brush: spot tap without brush hints instead of cleaning; with brush cleans all 4 and completes', async () => {
  const onComplete = vi.fn()
  render(<PracticeBrushScreen module={mod('practice')} onComplete={onComplete} />)

  // wrong interaction: no brush selected yet — gentle hint, spot stays
  await act(async () => {
    fireEvent.click(screen.getByTestId('plaque-0'))
  })
  expect(audio.say).toHaveBeenCalledWith('en', 'milo.hint.tap')
  expect(screen.getByTestId('plaque-0')).toBeInTheDocument()
  expect(onComplete).not.toHaveBeenCalled()

  fireEvent.click(screen.getByTestId('pick-brush'))
  for (const i of [0, 1, 2, 3]) {
    await act(async () => {
      fireEvent.click(screen.getByTestId(`plaque-${i}`))
    })
  }
  expect(screen.queryByTestId('plaque-0')).toBeNull()
  expect(audio.say).toHaveBeenCalledWith('en', 'practice.brush.done')
  expect(onComplete).toHaveBeenCalledTimes(1)
})

test('prepare: wrong order does not advance; juice then brush completes', async () => {
  vi.useFakeTimers()
  const onComplete = vi.fn()
  render(<PrepareScreen module={mod('prepare')} onComplete={onComplete} />)

  // the brush is second, so pressing it first must do nothing but wiggle
  await act(async () => {
    fireEvent.click(screen.getByTestId('prep-brush'))
  })
  expect(screen.queryByTestId('prepare-brush-beat')).toBeNull()
  expect(onComplete).not.toHaveBeenCalled()

  // the juice rises to the tooth and sprays it to sleep
  await act(async () => {
    fireEvent.click(screen.getByTestId('prep-spray'))
  })
  expect(screen.getByTestId('prepare-spray-beat')).toBeInTheDocument()
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2500)
  })
  expect(screen.queryByTestId('prepare-spray-beat')).toBeNull()
  expect(onComplete).not.toHaveBeenCalled()

  // then the brush scrubs it clean
  await act(async () => {
    fireEvent.click(screen.getByTestId('prep-brush'))
  })
  expect(screen.getByTestId('prepare-brush-beat')).toBeInTheDocument()
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3000)
  })
  expect(audio.say).toHaveBeenCalledWith('en', 'prepare.step.brush')
  expect(audio.say).toHaveBeenCalledWith('en', 'prepare.done')
  expect(onComplete).toHaveBeenCalledTimes(1)
})

test('spray: counts one to ten aloud then completes unconditionally', async () => {
  vi.useFakeTimers()
  const onComplete = vi.fn()
  render(<SprayScreen module={mod('spray')} onComplete={onComplete} />)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(15000)
  })
  expect(audio.say).toHaveBeenCalledWith('en', 'spray.count.7')
  expect(audio.say).toHaveBeenCalledWith('en', 'spray.done')
  expect(onComplete).toHaveBeenCalledTimes(1)
})
