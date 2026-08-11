import { render, screen, cleanup } from '@testing-library/react'
import { WelcomeScreen } from '../src/screens/WelcomeScreen'
import { useGame } from '../src/store/game'
import { audio } from '../src/lib/audio'

beforeEach(() => {
  cleanup()
  localStorage.clear()
  useGame.getState().reset()
  useGame.getState().setLang('en')
  vi.spyOn(audio, 'say').mockResolvedValue()
})
afterEach(() => vi.restoreAllMocks())

test('welcome screen renders the Milo hero and the start button', async () => {
  render(<WelcomeScreen onStart={vi.fn()} />)
  expect(screen.getByTestId('milo-hero')).toBeInTheDocument()
  expect(screen.getByAltText('Milo the Tooth')).toHaveAttribute('src', '/art/milo.webp')
  expect(await screen.findByRole('button', { name: /Start the Adventure/ })).toBeInTheDocument()
})
