import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { PracticeBrushScreen } from '../src/screens/PracticeBrushScreen'
import { PrepareScreen } from '../src/screens/PrepareScreen'
import { SprayScreen } from '../src/screens/SprayScreen'
import { useGame } from '../src/store/game'
import { audio } from '../src/lib/audio'
import type { ModuleDef } from '../src/content/types'

const mod = (id: string): ModuleDef => ({ id, kind: 'practice-brush', stars: 1, titleId: 'practice.brush.title' })

beforeEach(() => {
  cleanup()
  localStorage.clear()
  useGame.getState().reset()
  useGame.getState().setLang('en')
  vi.spyOn(audio, 'say').mockResolvedValue()
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

async function finishPrepareIntro() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

test('brush: spot tap without brush hints instead of cleaning; with brush cleans all 4 and completes', async () => {
  const onComplete = vi.fn()
  render(<PracticeBrushScreen module={mod('practice')} onComplete={onComplete} />)

  // wrong interaction: no brush selected yet — gentle hint, spot stays
  await act(async () => {
    fireEvent.click(screen.getByTestId('plaque-0'))
  })
  expect(audio.say).toHaveBeenCalledWith('en', 'milo.hint.tap')
  expect(screen.getByTestId('plaque-0')).toBeInTheDocument()
  expect(onComplete).not.toHaveBeenCalled()

  fireEvent.click(screen.getByTestId('pick-brush'))
  for (const i of [0, 1, 2, 3]) {
    await act(async () => {
      fireEvent.click(screen.getByTestId(`plaque-${i}`))
    })
  }
  expect(screen.queryByTestId('plaque-0')).toBeNull()
  expect(audio.say).toHaveBeenCalledWith('en', 'practice.brush.done')
  expect(onComplete).toHaveBeenCalledTimes(1)
})

test('Arabic brush cleaning plays an erase sound as each stain disappears', async () => {
  useGame.getState().setLang('ar')
  const eraseSfx = vi.spyOn(audio, 'playEraseSfx').mockImplementation(() => {})
  render(<PracticeBrushScreen module={mod('practice')} onComplete={vi.fn()} />)

  fireEvent.click(screen.getByTestId('pick-brush'))
  for (const i of [0, 1, 2, 3]) {
    await act(async () => {
      fireEvent.click(screen.getByTestId(`plaque-${i}`))
    })
  }

  expect(eraseSfx).toHaveBeenCalledTimes(4)
})

test('English brush cleaning keeps the original silent stain erase behavior', async () => {
  const eraseSfx = vi.spyOn(audio, 'playEraseSfx').mockImplementation(() => {})
  render(<PracticeBrushScreen module={mod('practice')} onComplete={vi.fn()} />)

  fireEvent.click(screen.getByTestId('pick-brush'))
  await act(async () => {
    fireEvent.click(screen.getByTestId('plaque-0'))
  })

  expect(eraseSfx).not.toHaveBeenCalled()
})

test('prepare: wrong order does not advance; juice then brush completes', async () => {
  vi.useFakeTimers()
  const onComplete = vi.fn()
  render(<PrepareScreen module={mod('prepare')} onComplete={onComplete} />)
  await finishPrepareIntro()

  // the brush is second, so pressing it first must do nothing but wiggle
  await act(async () => {
    fireEvent.click(screen.getByTestId('prep-brush'))
  })
  expect(screen.queryByTestId('prepare-brush-beat')).toBeNull()
  expect(onComplete).not.toHaveBeenCalled()

  // the juice rises to the tooth and sprays it to sleep
  await act(async () => {
    fireEvent.click(screen.getByTestId('prep-spray'))
  })
  expect(screen.getByTestId('prepare-spray-beat')).toBeInTheDocument()
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2500)
  })
  expect(screen.queryByTestId('prepare-spray-beat')).toBeNull()
  expect(onComplete).not.toHaveBeenCalled()

  // then the brush comes up and waits — it cleans nothing on its own
  await act(async () => {
    fireEvent.click(screen.getByTestId('prep-brush'))
  })
  expect(screen.getByTestId('prepare-brush-beat')).toBeInTheDocument()
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000)
  })
  expect(audio.say).toHaveBeenCalledWith('en', 'prepare.step.scrub')
  expect(onComplete).not.toHaveBeenCalled()

  // the child presses each sticky spot, and each one gets its own praise
  for (const i of [0, 1, 2, 3]) {
    await act(async () => {
      fireEvent.click(screen.getByTestId(`plaque-${i}`))
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200)
    })
  }
  for (const n of [1, 2, 3]) expect(audio.say).toHaveBeenCalledWith('en', `milo.praise.${n}`)
  expect(audio.say).toHaveBeenCalledWith('en', 'prepare.done')
  expect(onComplete).toHaveBeenCalledTimes(1)
})

test('Arabic prepare brush plays the recorded decay-removal sound when stains come away', async () => {
  vi.useFakeTimers()
  useGame.getState().setLang('ar')
  const eraseSfx = vi.spyOn(audio, 'playEraseSfx').mockImplementation(() => {})
  const starSfx = vi.spyOn(audio, 'playStarSfx').mockImplementation(() => {})
  const decayRemovalSfx = vi.spyOn(audio, 'playDecayRemovalSfx').mockImplementation(() => {})
  render(<PrepareScreen module={mod('prepare')} onComplete={vi.fn()} />)
  await finishPrepareIntro()

  await act(async () => {
    fireEvent.click(screen.getByTestId('prep-spray'))
    await vi.advanceTimersByTimeAsync(2500)
  })
  await act(async () => {
    fireEvent.click(screen.getByTestId('prep-brush'))
  })
  await act(async () => {
    fireEvent.click(screen.getByTestId('plaque-0'))
    await vi.advanceTimersByTimeAsync(320)
  })
  await act(async () => {
    fireEvent.click(screen.getByTestId('plaque-1'))
    await vi.advanceTimersByTimeAsync(320)
  })

  expect(decayRemovalSfx).toHaveBeenCalledTimes(1)
  expect(eraseSfx).not.toHaveBeenCalled()
  expect(starSfx).not.toHaveBeenCalled()
})

test('Arabic prepare uses only the recorded dentist narration lines', async () => {
  vi.useFakeTimers()
  useGame.getState().setLang('ar')
  vi.spyOn(audio, 'playDecayRemovalSfx').mockImplementation(() => {})
  const onComplete = vi.fn()
  render(<PrepareScreen module={mod('prepare')} onComplete={onComplete} />)
  await finishPrepareIntro()

  await act(async () => {
    fireEvent.click(screen.getByTestId('prep-brush'))
  })
  await act(async () => {
    fireEvent.click(screen.getByTestId('prep-spray'))
    await vi.advanceTimersByTimeAsync(2500)
  })
  await act(async () => {
    fireEvent.click(screen.getByTestId('prep-brush'))
  })
  for (const i of [0, 1, 2, 3]) {
    await act(async () => {
      fireEvent.click(screen.getByTestId(`plaque-${i}`))
      await vi.advanceTimersByTimeAsync(1200)
    })
  }

  expect(audio.say).toHaveBeenCalledWith('ar', 'prepare.step.brush')
  expect(audio.say).toHaveBeenCalledWith('ar', 'prepare.done')
  for (const id of [
    'prepare.intro',
    'prepare.step.spray',
    'prepare.step.scrub',
    'milo.great',
    'milo.hint.tap',
    'milo.praise.1',
    'milo.praise.2',
    'milo.praise.3',
    'milo.praise.4',
  ]) {
    expect(audio.say).not.toHaveBeenCalledWith('ar', id)
  }
  expect(onComplete).toHaveBeenCalledTimes(1)
})

test('English prepare brush does not add Arabic decay removal sounds', async () => {
  vi.useFakeTimers()
  const eraseSfx = vi.spyOn(audio, 'playEraseSfx').mockImplementation(() => {})
  const starSfx = vi.spyOn(audio, 'playStarSfx').mockImplementation(() => {})
  const decayRemovalSfx = vi.spyOn(audio, 'playDecayRemovalSfx').mockImplementation(() => {})
  render(<PrepareScreen module={mod('prepare')} onComplete={vi.fn()} />)
  await finishPrepareIntro()

  await act(async () => {
    fireEvent.click(screen.getByTestId('prep-spray'))
    await vi.advanceTimersByTimeAsync(2500)
  })
  await act(async () => {
    fireEvent.click(screen.getByTestId('prep-brush'))
  })
  await act(async () => {
    fireEvent.click(screen.getByTestId('plaque-0'))
    await vi.advanceTimersByTimeAsync(320)
  })

  expect(decayRemovalSfx).not.toHaveBeenCalled()
  expect(eraseSfx).not.toHaveBeenCalled()
  expect(starSfx).not.toHaveBeenCalled()
})

test('prepare: tools stay inactive until intro narration finishes', async () => {
  const say = vi.mocked(audio.say)
  let finishIntro!: () => void
  say.mockImplementation((_lang, id) =>
    id === 'prepare.intro' ? new Promise<void>(resolve => (finishIntro = resolve)) : Promise.resolve(),
  )

  render(<PrepareScreen module={mod('prepare')} onComplete={vi.fn()} />)
  const spray = screen.getByTestId('prep-spray')

  expect(spray).toBeDisabled()
  fireEvent.click(spray)
  expect(screen.queryByTestId('prepare-spray-beat')).toBeNull()

  await act(async () => {
    finishIntro()
    await Promise.resolve()
  })

  expect(spray).not.toBeDisabled()
})

test('prepare: brush stays inactive until its step narration finishes', async () => {
  vi.useFakeTimers()
  const say = vi.mocked(audio.say)
  let finishBrushLine!: () => void
  say.mockImplementation((_lang, id) =>
    id === 'prepare.step.brush' ? new Promise<void>(resolve => (finishBrushLine = resolve)) : Promise.resolve(),
  )

  render(<PrepareScreen module={mod('prepare')} onComplete={vi.fn()} />)
  await finishPrepareIntro()

  await act(async () => {
    fireEvent.click(screen.getByTestId('prep-spray'))
    await vi.advanceTimersByTimeAsync(2500)
  })

  const brush = screen.getByTestId('prep-brush')
  expect(brush).toBeDisabled()
  fireEvent.click(brush)
  expect(screen.queryByTestId('prepare-brush-beat')).toBeNull()

  await act(async () => {
    finishBrushLine()
  })

  expect(brush).not.toBeDisabled()
})

test('spray: counts one to ten aloud then completes unconditionally', async () => {
  vi.useFakeTimers()
  const onComplete = vi.fn()
  render(<SprayScreen module={mod('spray')} onComplete={onComplete} />)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(15000)
  })
  expect(audio.say).toHaveBeenCalledWith('en', 'spray.count.7')
  expect(audio.say).toHaveBeenCalledWith('en', 'spray.done')
  expect(onComplete).toHaveBeenCalledTimes(1)
})

test('Arabic spray uses the two recorded counting lines and count artwork', async () => {
  vi.useFakeTimers()
  useGame.getState().setLang('ar')
  const onComplete = vi.fn()
  render(<SprayScreen module={mod('spray')} onComplete={onComplete} />)

  expect(screen.getByTestId('spray-count-art')).toHaveAttribute('src', '/art/visit-step-count.webp')

  await act(async () => {
    await vi.advanceTimersByTimeAsync(11_000)
  })

  expect(audio.say).toHaveBeenCalledWith('ar', 'spray.intro')
  expect(audio.say).toHaveBeenCalledWith('ar', 'spray.countToTen')
  for (let n = 1; n <= 10; n++) expect(audio.say).not.toHaveBeenCalledWith('ar', `spray.count.${n}`)
  expect(audio.say).not.toHaveBeenCalledWith('ar', 'spray.done')
  expect(screen.getByTestId('spray-count-art')).toHaveAttribute('src', '/art/visit-step-count-ten.webp')
  expect(onComplete).toHaveBeenCalledTimes(1)
})
