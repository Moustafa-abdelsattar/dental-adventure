import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import App from '../src/App'
import { useGame } from '../src/store/game'

beforeEach(() => {
  cleanup()
  localStorage.clear()
  useGame.getState().reset()
  history.replaceState(null, '', '/')
})

test('flow: language → parent (visit + name) → welcome; dir flips for Arabic', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'العربية' }))
  expect(document.documentElement.dir).toBe('rtl')
  fireEvent.click(screen.getByRole('button', { name: /زيارة علاج/ }))
  expect(useGame.getState().path).toBe('treatment')
  fireEvent.click(screen.getByRole('button', { name: /تخطّي/ }))
  expect(screen.getByRole('button', { name: /ابدأ المغامرة/ })).toBeInTheDocument()
})

test('?visit=checkup skips the visit chooser', () => {
  history.replaceState(null, '', '/?visit=checkup')
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'English' }))
  expect(screen.queryByText(/Which visit/)).toBeNull()
  expect(screen.getByPlaceholderText(/Name \(optional\)/)).toBeInTheDocument()
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
