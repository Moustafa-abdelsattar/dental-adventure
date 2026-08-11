import { render, screen, cleanup } from '@testing-library/react'
import { WelcomeScreen } from '../src/screens/WelcomeScreen'
import { SafeBoundary } from '../src/components/ui/SafeBoundary'
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

test('welcome screen never crashes without WebGL — start button always present', async () => {
  render(<WelcomeScreen onStart={vi.fn()} />)
  expect(await screen.findByRole('button', { name: /Start the Adventure/ })).toBeInTheDocument()
})

function Bomb(): never {
  throw new Error('no webgl')
}

test('SafeBoundary swaps a crashing child for the fallback', () => {
  render(
    <SafeBoundary fallback={<p>plan-b</p>}>
      <Bomb />
    </SafeBoundary>,
  )
  expect(screen.getByText('plan-b')).toBeInTheDocument()
})
