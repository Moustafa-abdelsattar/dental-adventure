import { render, fireEvent, act } from '@testing-library/react'
import { Milo } from '../src/game/milo/Milo'
import { audio } from '../src/lib/audio'

test('renders all layers', () => {
  const { container } = render(<Milo />)
  for (const id of ['milo-body', 'milo-arm-l', 'milo-arm-r', 'milo-eye-l', 'milo-eye-r', 'milo-mouth', 'milo-cape', 'milo-shadow'])
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
