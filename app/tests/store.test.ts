import { useGame, initFromUrl } from '../src/store/game'

beforeEach(() => {
  localStorage.clear()
  useGame.getState().reset()
})

test('awardStar is idempotent and counts to 5, latching hero', () => {
  const s = useGame.getState()
  s.awardStar('clinic')
  s.awardStar('clinic')
  s.awardStar('tools')
  expect(Object.keys(useGame.getState().stars)).toHaveLength(2)
  expect(useGame.getState().heroEarned).toBe(false)
  ;['practice', 'spray', 'visit'].forEach(m => useGame.getState().awardStar(m))
  expect(useGame.getState().heroEarned).toBe(true)
})

test('heroEarned never unlatches and stars never reset on replay', () => {
  ;['a', 'b', 'c', 'd', 'e'].forEach(m => useGame.getState().awardStar(m))
  useGame.getState().startFreePlay()
  expect(useGame.getState().heroEarned).toBe(true)
  expect(Object.keys(useGame.getState().stars)).toHaveLength(5)
})

test('initFromUrl presets path and ignores nonsense', () => {
  initFromUrl('?visit=treatment')
  expect(useGame.getState().path).toBe('treatment')
  initFromUrl('?visit=nonsense')
  expect(useGame.getState().path).toBe('treatment')
})

test('persists to localStorage', () => {
  useGame.getState().setChildName('Omar')
  expect(localStorage.getItem('dental-adventure-v1')).toContain('Omar')
})
