import { render, screen, fireEvent, act, cleanup, within } from '@testing-library/react'
import { ClinicScreen } from '../src/screens/ClinicScreen'
import { useGame } from '../src/store/game'
import { audio } from '../src/lib/audio'
import { milo } from '../src/game/Milo/bus'
import type { MiloState } from '../src/game/Milo/Milo'
import hotspots from '../src/content/clinic-hotspots.json'

const module = { id: 'clinic', kind: 'clinic' as const, stars: 1, titleId: 'clinic.title' }

const IDLE_MS = 10000

/** Touch an object the way a finger does: down and up in the same place. */
async function tap(id: string) {
  const el = screen.getByTestId(`hotspot-${id}`)
  fireEvent.pointerDown(el, { clientX: 100, clientY: 100 })
  fireEvent.pointerUp(el, { clientX: 100, clientY: 100 })
  // the object plays its beat before the card arrives
  await act(async () => {
    await vi.advanceTimersByTimeAsync(600)
  })
}

async function dismissCard() {
  await act(async () => {
    fireEvent.click(within(screen.getByTestId('zoom-card')).getByRole('button', { name: 'Next' }))
  })
}

async function meet(id: string) {
  await tap(id)
  await dismissCard()
}

beforeEach(() => {
  cleanup()
  vi.useFakeTimers()
  localStorage.clear()
  useGame.getState().reset()
  useGame.getState().setLang('en')
  milo._resetForTests()
  vi.spyOn(audio, 'say').mockResolvedValue()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

test('exploring all four objects completes the module', async () => {
  const onComplete = vi.fn()
  render(<ClinicScreen module={module} onComplete={onComplete} />)
  for (const id of ['light', 'chair', 'sink', 'table']) await meet(id)
  expect(onComplete).toHaveBeenCalledTimes(1)
  expect(audio.say).toHaveBeenCalledWith('en', 'clinic.done')
})

test('fewer than four does not complete; explored badge shows', async () => {
  const onComplete = vi.fn()
  render(<ClinicScreen module={module} onComplete={onComplete} />)
  await meet('chair')
  expect(screen.getByTestId('explored-chair')).toBeInTheDocument()
  expect(onComplete).not.toHaveBeenCalled()
})

test('idle 10s triggers a spoken hint', () => {
  render(<ClinicScreen module={module} onComplete={vi.fn()} />)
  act(() => {
    vi.advanceTimersByTime(IDLE_MS)
  })
  expect(audio.say).toHaveBeenCalledWith('en', 'milo.hint.tap')
})

test('the object plays its beat before the card arrives', async () => {
  render(<ClinicScreen module={module} onComplete={vi.fn()} />)
  const el = screen.getByTestId('hotspot-chair')
  fireEvent.pointerDown(el, { clientX: 100, clientY: 100 })
  fireEvent.pointerUp(el, { clientX: 100, clientY: 100 })

  // narration starts with the motion, not with the words
  expect(audio.say).toHaveBeenCalledWith('en', 'clinic.chair.desc')
  expect(screen.queryByTestId('zoom-card')).not.toBeInTheDocument()

  await act(async () => {
    await vi.advanceTimersByTimeAsync(600)
  })
  expect(screen.getByTestId('zoom-card')).toBeInTheDocument()
})

test('dragging across an object does not open it', async () => {
  render(<ClinicScreen module={module} onComplete={vi.fn()} />)
  const el = screen.getByTestId('hotspot-chair')
  fireEvent.pointerDown(el, { clientX: 100, clientY: 100 })
  fireEvent.pointerUp(el, { clientX: 220, clientY: 140 })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(600)
  })
  expect(screen.queryByTestId('zoom-card')).not.toBeInTheDocument()
})

test('a cancelled press does not open it', async () => {
  render(<ClinicScreen module={module} onComplete={vi.fn()} />)
  const el = screen.getByTestId('hotspot-chair')
  fireEvent.pointerDown(el, { clientX: 100, clientY: 100 })
  fireEvent.pointerCancel(el)
  fireEvent.pointerUp(el, { clientX: 100, clientY: 100 })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(600)
  })
  expect(screen.queryByTestId('zoom-card')).not.toBeInTheDocument()
})

test('the room is one plate with a layer per object on top of it', () => {
  render(<ClinicScreen module={module} onComplete={vi.fn()} />)
  for (const id of ['light', 'chair', 'sink', 'table']) {
    const layer = screen.getByTestId(`layer-${id}`)
    expect(layer.querySelector('img')).toHaveAttribute('src', `/art/clinic-layer-${id}.webp`)
    // a layer is scenery; only the hotspot over it takes a press
    expect(layer.className).toContain('pointer-events-none')
  }
})

test('each tap target is placed from its measured box', () => {
  render(<ClinicScreen module={module} onComplete={vi.fn()} />)
  for (const id of ['light', 'chair', 'sink', 'table'] as const) {
    const el = screen.getByTestId(`hotspot-${id}`)
    const measured = hotspots[id]
    // placed from the JSON the import script measures, not from hand-tuned numbers
    expect(el.style.left).toBe(`${measured.left}%`)
    expect(el.style.top).toBe(`${measured.top}%`)
    expect(el.style.width).toBe(`${measured.width}%`)
    expect(el.style.height).toBe(`${measured.height}%`)
  }
})

test('no object is buried under a bigger one that draws after it', () => {
  render(<ClinicScreen module={module} onComplete={vi.fn()} />)
  const ids = ['light', 'chair', 'sink', 'table'] as const
  const order = ids
    .map(id => ({ id, el: screen.getByTestId(`hotspot-${id}`) }))
    .sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    .map(x => x.id)

  // The rinse bowl sits bodily inside the chair's box. Later siblings paint on
  // top, so anything contained by another must come after it or it is dead.
  for (let i = 0; i < order.length; i++) {
    for (let j = i + 1; j < order.length; j++) {
      const under = hotspots[order[i]]
      const over = hotspots[order[j]]
      const overSwallowsUnder =
        over.left <= under.left &&
        over.top <= under.top &&
        over.left + over.width >= under.left + under.width &&
        over.top + over.height >= under.top + under.height
      expect(overSwallowsUnder).toBe(false)
    }
  }
})

test('Milo points when an object is touched and is pleased when it is met', async () => {
  const seen: MiloState[] = []
  milo.onReact(s => seen.push(s))
  render(<ClinicScreen module={module} onComplete={vi.fn()} />)
  await tap('chair')
  expect(seen).toContain('point')
  await dismissCard()
  expect(seen).toContain('happy')
})

test('the room warms only while the light is the object being touched', async () => {
  render(<ClinicScreen module={module} onComplete={vi.fn()} />)
  expect(screen.getByTestId('stage-effects')).toBeInTheDocument()
  const wash = screen.getByTestId('light-wash')
  expect(wash).toBeInTheDocument()

  await tap('sink')
  expect(wash.style.opacity).toBe('0')
})
