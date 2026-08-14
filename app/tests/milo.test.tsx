import { createRef } from 'react'
import { render, fireEvent, act } from '@testing-library/react'
import { Milo, type MiloHandle } from '../src/game/Milo/Milo'
import { audio } from '../src/lib/audio'

test('renders all layers', () => {
  const { container } = render(<Milo />)
  // the separated layers the rig needs, so a Rive port can address the same set
  for (const id of [
    'milo-body',
    'milo-arm-l',
    'milo-arm-r',
    'milo-eye-l',
    'milo-eye-r',
    'milo-brow-l',
    'milo-brow-r',
    'milo-mouth',
    'milo-cheeks',
    'milo-cape',
    'milo-shadow',
  ])
    expect(container.querySelector(`#${id}`)).toBeTruthy()
})

test('tap replays last narration', () => {
  const spy = vi.spyOn(audio, 'replayLast').mockResolvedValue()
  const { container } = render(<Milo />)
  fireEvent.click(container.querySelector('svg')!)
  expect(spy).toHaveBeenCalled()
})

test('talking state opens mouth', () => {
  let setTalking: (t: boolean) => void = () => {}
  vi.spyOn(audio, 'onTalkingChange').mockImplementation(cb => {
    setTalking = cb
    return () => {}
  })
  const { container } = render(<Milo />)
  expect(container.querySelector('#milo-mouth')!.getAttribute('data-variant')).toBe('smile')
  act(() => setTalking(true))
  expect(container.querySelector('#milo-mouth')!.getAttribute('data-variant')).toBe('talking')
})

test('celebrate pose uses big smile', () => {
  const { container } = render(<Milo pose="celebrate" />)
  expect(container.querySelector('#milo-mouth')!.getAttribute('data-variant')).toBe('big')
})

test('trigger plays a state and transient ones fall back to idle', () => {
  vi.useFakeTimers()
  const ref = createRef<MiloHandle>()
  const { container } = render(<Milo ref={ref} />)
  const svg = () => container.querySelector('svg')!

  expect(svg().getAttribute('data-state')).toBe('idle')
  act(() => ref.current!.trigger('celebrate'))
  expect(svg().getAttribute('data-state')).toBe('celebrate')
  act(() => {
    vi.advanceTimersByTime(1500)
  })
  expect(svg().getAttribute('data-state')).toBe('idle')

  // point is a held state — it stays until something else changes it
  act(() => ref.current!.trigger('point'))
  act(() => {
    vi.advanceTimersByTime(3000)
  })
  expect(svg().getAttribute('data-state')).toBe('point')
  vi.useRealTimers()
})

test('setTalking drives the mouth independently of narration', () => {
  vi.spyOn(audio, 'onTalkingChange').mockImplementation(() => () => {})
  const ref = createRef<MiloHandle>()
  const { container } = render(<Milo ref={ref} />)
  const mouth = () => container.querySelector('#milo-mouth')!

  expect(mouth().getAttribute('data-variant')).toBe('smile')
  act(() => ref.current!.setTalking(true))
  expect(mouth().getAttribute('data-variant')).toBe('talking')
  act(() => ref.current!.setTalking(false))
  expect(mouth().getAttribute('data-variant')).toBe('smile')
})
