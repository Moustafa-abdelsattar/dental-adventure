import { useGame, initFromUrl, sanitize } from '../src/store/game'

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

// A save is a file on a device we do not control, written by a build that may
// not be this one. `lang: 'fr'` used to white-screen the game on boot, and
// because the bad value is persisted, reloading never recovered it.
test.each([
  ['not an object', 'hello'],
  ['null', null],
  ['undefined', undefined],
  ['an array', ['clinic']],
  ['a number', 7],
])('sanitize survives %s', (_label, raw) => {
  expect(() => sanitize(raw)).not.toThrow()
})

test('sanitize drops a language the game does not have', () => {
  expect(sanitize({ lang: 'fr', path: 'checkup' }).lang).toBeNull()
  expect(sanitize({ lang: 'en' }).lang).toBe('en')
  expect(sanitize({ lang: 'ar' }).lang).toBe('ar')
})

test('sanitize drops a visit type the game does not have', () => {
  expect(sanitize({ path: 'root-canal' }).path).toBeNull()
  expect(sanitize({ path: 'treatment' }).path).toBe('treatment')
})

test('sanitize rebuilds stars as a plain map of true, whatever it was', () => {
  expect(sanitize({ stars: 'lots' }).stars).toEqual({})
  expect(sanitize({ stars: ['clinic'] }).stars).toEqual({})
  expect(sanitize({ stars: { clinic: true, tools: 'yes', ghost: false } }).stars).toEqual({ clinic: true })
})

test('sanitize will not take a hero badge that was not earned', () => {
  expect(sanitize({ heroEarned: true, stars: {} }).heroEarned).toBe(false)
  const five = { a: true, b: true, c: true, d: true, e: true }
  expect(sanitize({ heroEarned: true, stars: five }).heroEarned).toBe(true)
})

test('sanitize coerces a name that is not a string, and caps its length', () => {
  expect(sanitize({ childName: 42 }).childName).toBe('')
  expect(sanitize({ childName: 'A'.repeat(300) }).childName).toHaveLength(24)
})
