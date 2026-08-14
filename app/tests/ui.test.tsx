import { render, screen, fireEvent } from '@testing-library/react'
import { GameButton } from '../src/components/ui/GameButton'
import { HUD } from '../src/game/HUD'
import { SpeechBubble } from '../src/components/ui/SpeechBubble'
import { useGame } from '../src/store/game'
import { audio } from '../src/lib/audio'

beforeEach(() => {
  localStorage.clear()
  useGame.getState().reset()
  useGame.getState().setLang('en')
})

test('GameButton fires onPress and meets touch size', () => {
  const fn = vi.fn()
  render(<GameButton label="Start" onPress={fn} />)
  const btn = screen.getByRole('button', { name: /start/i })
  fireEvent.click(btn)
  expect(fn).toHaveBeenCalled()
  expect(btn.className).toMatch(/min-h-\[72px\]/)
})

test('HUD shows filled stars matching store', () => {
  useGame.getState().awardStar('clinic')
  useGame.getState().awardStar('tools')
  render(<HUD />)
  expect(screen.getAllByTestId('star-filled')).toHaveLength(2)
  expect(screen.getAllByTestId('star-empty')).toHaveLength(3)
})

test('HUD title uses child name', () => {
  useGame.getState().setChildName('Omar')
  render(<HUD />)
  expect(screen.getByText(/Omar's Adventure/)).toBeInTheDocument()
})

test('HUD carries Milo on every screen', () => {
  render(<HUD />)
  expect(screen.getByTestId('hud-milo')).toBeInTheDocument()
})

test('SpeechBubble renders translated text and replays audio on tap', () => {
  useGame.getState().setChildName('Omar')
  const spy = vi.spyOn(audio, 'replayLast').mockResolvedValue()
  render(<SpeechBubble stringId="milo.great" />)
  const bubble = screen.getByText('Great job, Omar!')
  fireEvent.click(bubble)
  expect(spy).toHaveBeenCalled()
})
