import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import App from '../src/App'
import { useGame } from '../src/store/game'

beforeEach(() => {
  cleanup()
  vi.useRealTimers()
  localStorage.clear()
  useGame.getState().reset()
  history.replaceState(null, '', '/')
  document.documentElement.dir = 'ltr'
  document.documentElement.lang = 'en'
})

afterEach(() => {
  vi.useRealTimers()
})

test('flow: language → parent (visit + name) → welcome; dir flips for Arabic', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'العربية' }))
  expect(document.documentElement.dir).toBe('rtl')
  fireEvent.click(screen.getByRole('button', { name: /زيارة علاج/ }))
  expect(useGame.getState().path).toBe('treatment')
  fireEvent.click(screen.getByRole('button', { name: /تخطّي/ }))
  expect(screen.getByRole('button', { name: /يلا نبدأ المغامرة/ })).toBeInTheDocument()
})

test('?visit=checkup skips the visit chooser', () => {
  history.replaceState(null, '', '/?visit=checkup')
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'English' }))
  expect(screen.queryByText(/Which visit/)).toBeNull()
  expect(screen.getByPlaceholderText(/Name \(optional\)/)).toBeInTheDocument()
})

test('invalid ?visit keeps the parent visit chooser instead of forcing a path', () => {
  history.replaceState(null, '', '/?visit=nonsense')
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'English' }))
  expect(screen.getByText(/Which visit/)).toBeInTheDocument()
  expect(useGame.getState().path).toBeNull()
})

test('name is saved and used after start', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'English' }))
  fireEvent.click(screen.getByRole('button', { name: /First Checkup/ }))
  fireEvent.change(screen.getByPlaceholderText(/Name \(optional\)/), { target: { value: 'Omar' } })
  fireEvent.click(screen.getByRole('button', { name: /Next/ }))
  expect(useGame.getState().childName).toBe('Omar')
  fireEvent.click(screen.getByRole('button', { name: /Start the Adventure/ }))
  expect(screen.getByText(/Omar's Adventure/)).toBeInTheDocument()
})

test('Arabic start button mounts phase one immediately', () => {
  useGame.getState().setLang('ar')
  useGame.getState().setPath('checkup')
  useGame.getState().awardStar('setup-complete')

  render(<App />)
  const start = screen.getByTestId('start-adventure').querySelector('button')!
  fireEvent.click(start)

  expect(screen.getByTestId('clinic-scene')).toBeInTheDocument()
})

test('returning child skips parent setup, then continues from the first incomplete module', () => {
  useGame.getState().setLang('en')
  useGame.getState().setPath('checkup')
  useGame.getState().setChildName('Omar')
  useGame.getState().awardStar('clinic')

  render(<App />)
  expect(screen.queryByText(/Which visit/)).toBeNull()
  expect(screen.getByText(/Welcome back, Omar/)).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: /Start the Adventure/ }))
  expect(screen.getByText(/Omar's Adventure/)).toBeInTheDocument()
  expect(screen.getByText(/Meet the Friendly Tools/)).toBeInTheDocument()
})

test('start over from a returning Arabic session resets progress and direction without a reload', () => {
  useGame.getState().setLang('ar')
  useGame.getState().setPath('treatment')
  useGame.getState().awardStar('clinic')

  render(<App />)
  expect(document.documentElement.dir).toBe('rtl')

  fireEvent.click(screen.getByTestId('start-over'))
  expect(screen.getByTestId('start-over')).toHaveTextContent('دوس تاني')
  fireEvent.click(screen.getByTestId('start-over'))

  expect(useGame.getState().lang).toBeNull()
  expect(useGame.getState().path).toBeNull()
  expect(Object.keys(useGame.getState().stars)).toHaveLength(0)
  expect(document.documentElement.dir).toBe('ltr')
  expect(screen.getByText('Choose language')).toBeInTheDocument()
})

test('start over needs a fresh second tap before it wipes saved progress', () => {
  vi.useFakeTimers()
  useGame.getState().setLang('en')
  useGame.getState().setPath('checkup')
  useGame.getState().awardStar('clinic')

  render(<App />)
  fireEvent.click(screen.getByTestId('start-over'))
  expect(useGame.getState().path).toBe('checkup')
  expect(Object.keys(useGame.getState().stars)).toHaveLength(1)

  act(() => vi.advanceTimersByTime(4001))
  expect(screen.getByTestId('start-over')).toHaveTextContent('Start over')
  fireEvent.click(screen.getByTestId('start-over'))
  expect(useGame.getState().path).toBe('checkup')
  expect(Object.keys(useGame.getState().stars)).toHaveLength(1)

  fireEvent.click(screen.getByTestId('start-over'))
  expect(useGame.getState().path).toBeNull()
  expect(Object.keys(useGame.getState().stars)).toHaveLength(0)
})

test('completed child resumes to the reward instead of replaying finished modules', () => {
  useGame.getState().setLang('en')
  useGame.getState().setPath('checkup')
  ;['clinic', 'tools', 'tools-2', 'practice', 'visit'].forEach(id => useGame.getState().awardStar(id))

  render(<App />)
  expect(screen.getByText(/Welcome back/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Start the Adventure/ }))
  expect(screen.getByTestId('reward-screen')).toBeInTheDocument()
})

test('completed child in free play resumes to the activity picker after welcome', () => {
  useGame.getState().setLang('en')
  useGame.getState().setPath('checkup')
  ;['clinic', 'tools', 'tools-2', 'practice', 'visit'].forEach(id => useGame.getState().awardStar(id))
  useGame.getState().startFreePlay()

  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /Start the Adventure/ }))
  expect(screen.getByTestId('freeplay-picker')).toBeInTheDocument()
  expect(screen.getByTestId('freeplay-certificate')).toBeInTheDocument()
})
