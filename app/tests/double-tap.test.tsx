import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { ModuleHost } from '../src/screens/ModuleHost'
import { StoryBeat } from '../src/components/ui/StoryBeat'
import { screenChange } from '../src/motion/springs'
import type { ModuleRegistry, ModuleProps } from '../src/screens/registry'
import { useGame } from '../src/store/game'
import { audio } from '../src/lib/audio'

/**
 * The second half of a double press.
 *
 * A four-year-old presses things twice. The first press ends the screen, and by
 * the time the second one lands the screen it was aimed at is gone and
 * something else is under the finger — the next module's button, or Milo
 * arriving with a line to say. Left alone, that stray tap skips whatever it
 * hits, and the child never sees the thing they just earned.
 */
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
  vi.spyOn(audio, 'say').mockResolvedValue()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

test("a tap that lands as Milo arrives does not throw away his line", () => {
  const onDone = vi.fn()
  render(<StoryBeat stringId="story.calmer1" calm={0.3} onDone={onDone} />)

  // the tail of the press that finished the module
  fireEvent.click(screen.getByTestId('story-beat'))
  expect(onDone).not.toHaveBeenCalled()

  // a child who has read it and taps on purpose still gets through at once
  act(() => vi.advanceTimersByTime(600))
  fireEvent.click(screen.getByTestId('story-beat'))
  expect(onDone).toHaveBeenCalledTimes(1)
})

test('the screens are inert while one hands over to the next', () => {
  render(<ModuleHost registry={registry} />)
  const stack = screen.getByTestId('module-stack')
  expect(stack.style.pointerEvents).toBe('')

  fireEvent.click(screen.getByText('done-clinic'))
  expect(stack.style.pointerEvents).toBe('none')

  act(() => vi.advanceTimersByTime(screenChange.lock * 1000 + 50))
  expect(stack.style.pointerEvents).toBe('')
})

test('a module that is pressed twice still only finishes once', () => {
  render(<ModuleHost registry={registry} />)
  const done = screen.getByText('done-clinic')
  fireEvent.click(done)
  fireEvent.click(done)
  act(() => vi.advanceTimersByTime(1000))

  // one module's worth of stars, and the path has moved on by exactly one step
  expect(useGame.getState().stars).toEqual({ clinic: true })
  expect(screen.getByText('done-tools')).toBeInTheDocument()
})
