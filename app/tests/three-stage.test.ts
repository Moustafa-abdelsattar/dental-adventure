import { registerScene, preloadScene, warmNextScene, resetPreloader } from '../src/three/preload'
import { kelvinToRgb } from '../src/three/Lighting'
import { distanceToFrame } from '../src/three/CameraRig'

beforeEach(() => resetPreloader())

test('a scene is fetched at most once however often it is asked for', async () => {
  const load = vi.fn().mockResolvedValue('clinic')
  registerScene('clinic', load)
  await Promise.all([preloadScene('clinic'), preloadScene('clinic'), preloadScene('clinic')])
  expect(load).toHaveBeenCalledTimes(1)
})

test('arriving at a scene warms the next one, per the doc chain', async () => {
  const tools = vi.fn().mockResolvedValue(null)
  const tooth = vi.fn().mockResolvedValue(null)
  registerScene('tools', tools)
  registerScene('tooth', tooth)

  await warmNextScene('clinic')
  expect(tools).toHaveBeenCalledTimes(1)
  expect(tooth).not.toHaveBeenCalled()

  await warmNextScene('tools')
  expect(tooth).toHaveBeenCalledTimes(1)
})

test('the last scene has nothing to warm and does not throw', async () => {
  await expect(warmNextScene('tooth')).resolves.toBeUndefined()
})

test('an unregistered scene is a no-op, not a failure', async () => {
  await expect(preloadScene('clinic')).resolves.toBeUndefined()
})

test('a portrait phone backs the camera off further than a laptop', () => {
  const frame = { width: 3.4, height: 3.2 }
  const phone = distanceToFrame(frame, 42, 390 / 844)
  const laptop = distanceToFrame(frame, 42, 1440 / 900)
  expect(phone).toBeGreaterThan(laptop)
})

test('the framed box fits on screen at the distance chosen', () => {
  const frame = { width: 3.4, height: 3.2 }
  for (const aspect of [390 / 844, 430 / 900, 1440 / 900, 1024 / 768]) {
    const d = distanceToFrame(frame, 42, aspect)
    const halfV = Math.tan((42 * Math.PI) / 360)
    const visibleH = 2 * d * halfV
    const visibleW = visibleH * aspect
    // nothing cropped, in either direction, on any of these shapes
    expect(visibleH).toBeGreaterThanOrEqual(frame.height - 1e-9)
    expect(visibleW).toBeGreaterThanOrEqual(frame.width - 1e-9)
  }
})

test('the lamp coming on reads warmer than daylight', () => {
  const day = kelvinToRgb(6500)
  const lamp = kelvinToRgb(4200)
  const blue = (hex: string) => parseInt(hex.slice(5, 7), 16)
  const red = (hex: string) => parseInt(hex.slice(1, 3), 16)

  expect(day).toMatch(/^#[0-9a-f]{6}$/)
  // warmer means less blue against the same red — that is what "warm" is
  expect(blue(lamp)).toBeLessThan(blue(day))
  expect(red(lamp) - blue(lamp)).toBeGreaterThan(red(day) - blue(day))
})
