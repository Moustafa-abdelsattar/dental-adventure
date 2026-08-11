import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { RewardScreen } from '../src/screens/RewardScreen'
import { ModuleHost } from '../src/screens/ModuleHost'
import { renderCertificate } from '../src/lib/certificate'
import { useGame } from '../src/store/game'
import { audio } from '../src/lib/audio'
import type { ModuleRegistry, ModuleProps } from '../src/screens/registry'

beforeEach(() => {
  cleanup()
  localStorage.clear()
  useGame.getState().reset()
  useGame.getState().setLang('en')
  useGame.getState().setPath('checkup')
  vi.spyOn(audio, 'say').mockResolvedValue()
})
afterEach(() => vi.restoreAllMocks())

function completeAll() {
  ;['clinic', 'tools', 'tools-2', 'practice', 'visit'].forEach(id => useGame.getState().awardStar(id))
}

test('reward screen greets by name and Play Again keeps all five stars', () => {
  completeAll()
  useGame.getState().setChildName('Omar')
  render(<RewardScreen />)
  expect(screen.getByText('Congratulations, Omar!')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Play Again' }))
  expect(useGame.getState().freePlay).toBe(true)
  expect(Object.keys(useGame.getState().stars)).toHaveLength(5)
  expect(useGame.getState().heroEarned).toBe(true)
})

test('renderCertificate produces a png blob and draws the default name when empty', async () => {
  const fillTexts: string[] = []
  const ctx = new Proxy(
    { canvas: {}, direction: 'ltr', textAlign: 'center' },
    {
      get(target, prop) {
        if (prop === 'fillText') return (text: string) => fillTexts.push(text)
        if (prop in target) return (target as Record<string | symbol, unknown>)[prop]
        return () => {}
      },
      set() {
        return true
      },
    },
  ) as unknown as CanvasRenderingContext2D
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never)
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(cb =>
    cb(new Blob(['png'], { type: 'image/png' })),
  )

  const blob = await renderCertificate({ name: '  ', lang: 'en', date: new Date('2026-08-11') })
  expect(blob.type).toBe('image/png')
  expect(fillTexts).toContain('A Brave Dental Hero')
  expect(fillTexts).toContain('Dental Hero Certificate')
})

test('after Play Again the module host offers a free-play picker that replays modules', () => {
  completeAll()
  useGame.getState().startFreePlay()
  const FakeModule = ({ module, onComplete }: ModuleProps) => (
    <button onClick={() => onComplete()}>replay-done-{module.id}</button>
  )
  const registry: ModuleRegistry = {
    clinic: FakeModule,
    tools: FakeModule,
    'practice-brush': FakeModule,
    visit: FakeModule,
  }
  render(<ModuleHost registry={registry} />)
  expect(screen.getByTestId('freeplay-picker')).toBeInTheDocument()
  fireEvent.click(screen.getByTestId('freeplay-clinic'))
  fireEvent.click(screen.getByText('replay-done-clinic'))
  expect(screen.getByTestId('freeplay-picker')).toBeInTheDocument()
  expect(Object.keys(useGame.getState().stars)).toHaveLength(5)
  fireEvent.click(screen.getByTestId('freeplay-certificate'))
  expect(screen.getByTestId('reward-screen')).toBeInTheDocument()
})
