import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { VisitScreen } from '../src/screens/VisitScreen'
import { useGame } from '../src/store/game'
import { audio } from '../src/lib/audio'
import type { ModuleDef } from '../src/content/types'

const mod: ModuleDef = { id: 'visit', kind: 'visit', stars: 1, titleId: 'visit.title' }

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

async function flushAudioQueue() {
  await act(async () => {
    for (let i = 0; i < 6; i++) await Promise.resolve()
  })
}

test('mask tap reveals the smile underneath', async () => {
  render(<VisitScreen module={mod} onComplete={vi.fn()} />)
  await flushAudioQueue()
  expect(screen.getByTestId('drnour-mask')).toBeInTheDocument()
  await act(async () => {
    fireEvent.click(screen.getByTestId('drnour-mask'))
  })
  expect(screen.queryByTestId('drnour-mask')).toBeNull()
  expect(screen.getByTestId('drnour-smile')).toBeInTheDocument()
  expect(audio.say).toHaveBeenCalledWith('en', 'visit.maskOff')
})

test('full flow: mask → stop signal → six steps → complete, exactly once', async () => {
  vi.useFakeTimers()
  const onComplete = vi.fn()
  render(<VisitScreen module={mod} onComplete={onComplete} />)
  await flushAudioQueue()
  await act(async () => {
    fireEvent.click(screen.getByTestId('drnour-mask'))
  })
  await flushAudioQueue()
  await act(async () => {
    fireEvent.click(screen.getByTestId('raise-hand'))
  })
  expect(screen.getByTestId('paused-label')).toBeInTheDocument()
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000) // freeze ends
  })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30_000) // six steps auto-advance
  })
  for (const id of [
    'visit.step.chair',
    'visit.step.light',
    'visit.step.mirror',
    'visit.step.sleepy',
    'visit.step.count',
    'spray.count.1',
    'spray.count.2',
    'spray.count.3',
    'spray.count.4',
    'spray.count.5',
    'spray.count.6',
    'spray.count.7',
    'spray.count.8',
    'spray.count.9',
    'spray.count.10',
    'visit.step.clean',
    'visit.done',
  ])
    expect(audio.say).toHaveBeenCalledWith('en', id)
  expect(onComplete).toHaveBeenCalledTimes(1)
  // manual Next after auto-complete must not double-fire
  fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  expect(onComplete).toHaveBeenCalledTimes(1)
})

test('light glow is a slow fade, never a flash', () => {
  render(<VisitScreen module={mod} onComplete={vi.fn()} />)
  const glow = screen.getByTestId('visit-light')
  expect(Number(glow.getAttribute('data-glow-duration'))).toBeGreaterThanOrEqual(1)
})

test('mask cannot be tapped until Dr. Lili intro finishes', async () => {
  let finishMeet!: () => void
  vi.mocked(audio.say).mockImplementation((_, id) => {
    if (id === 'visit.meetDr') {
      return new Promise(resolve => {
        finishMeet = resolve
      })
    }
    return Promise.resolve()
  })

  render(<VisitScreen module={mod} onComplete={vi.fn()} />)
  expect(screen.getByTestId('drnour-mask')).toHaveAttribute('aria-disabled', 'true')

  await act(async () => {
    fireEvent.click(screen.getByTestId('drnour-mask'))
  })
  expect(screen.queryByTestId('drnour-smile')).toBeNull()
  expect(audio.say).not.toHaveBeenCalledWith('en', 'visit.maskOff')

  await act(async () => {
    finishMeet()
    await Promise.resolve()
  })
  expect(screen.getByTestId('drnour-mask')).not.toHaveAttribute('aria-disabled')

  await act(async () => {
    fireEvent.click(screen.getByTestId('drnour-mask'))
  })
  expect(screen.getByTestId('drnour-smile')).toBeInTheDocument()
  expect(audio.say).toHaveBeenCalledWith('en', 'visit.maskOff')
})

test('Arabic visit plays the mask prompt before allowing the mask tap', async () => {
  useGame.getState().setLang('ar')
  let finishMeet!: () => void
  let finishPrompt!: () => void
  vi.mocked(audio.say).mockImplementation((_, id) => {
    if (id === 'visit.meetDr') {
      return new Promise(resolve => {
        finishMeet = resolve
      })
    }
    if (id === 'visit.maskPrompt') {
      return new Promise(resolve => {
        finishPrompt = resolve
      })
    }
    return Promise.resolve()
  })

  render(<VisitScreen module={mod} onComplete={vi.fn()} />)
  expect(audio.say).toHaveBeenCalledWith('ar', 'visit.meetDr')

  await act(async () => {
    finishMeet()
    await Promise.resolve()
  })
  expect(audio.say).toHaveBeenCalledWith('ar', 'visit.maskPrompt')
  expect(screen.getByTestId('drnour-mask')).toHaveAttribute('aria-disabled', 'true')

  await act(async () => {
    fireEvent.click(screen.getByTestId('drnour-mask'))
  })
  expect(audio.say).not.toHaveBeenCalledWith('ar', 'visit.maskOff')

  await act(async () => {
    finishPrompt()
    await Promise.resolve()
  })
  expect(screen.getByTestId('drnour-mask')).not.toHaveAttribute('aria-disabled')

  await act(async () => {
    fireEvent.click(screen.getByTestId('drnour-mask'))
  })
  expect(audio.say).toHaveBeenCalledWith('ar', 'visit.maskOff')
})

test('hand cannot be raised until the stop signal narration finishes', async () => {
  let finishStop!: () => void
  vi.mocked(audio.say).mockImplementation((_, id) => {
    if (id === 'visit.stopSignal') {
      return new Promise(resolve => {
        finishStop = resolve
      })
    }
    return Promise.resolve()
  })

  render(<VisitScreen module={mod} onComplete={vi.fn()} />)
  await flushAudioQueue()
  await act(async () => {
    fireEvent.click(screen.getByTestId('drnour-mask'))
    await Promise.resolve()
  })

  expect(screen.getByTestId('raise-hand')).toBeDisabled()
  await act(async () => {
    fireEvent.click(screen.getByTestId('raise-hand'))
  })
  expect(screen.queryByTestId('paused-label')).toBeNull()
  expect(audio.say).not.toHaveBeenCalledWith('en', 'visit.stopSignalDone')

  await act(async () => {
    finishStop()
    await Promise.resolve()
  })
  expect(screen.getByTestId('raise-hand')).not.toBeDisabled()

  await act(async () => {
    fireEvent.click(screen.getByTestId('raise-hand'))
  })
  expect(screen.getByTestId('paused-label')).toBeInTheDocument()
})

test('Arabic visit plays the hand prompt before allowing the hand tap', async () => {
  useGame.getState().setLang('ar')
  let finishStop!: () => void
  let finishPrompt!: () => void
  vi.mocked(audio.say).mockImplementation((_, id) => {
    if (id === 'visit.stopSignal') {
      return new Promise(resolve => {
        finishStop = resolve
      })
    }
    if (id === 'visit.handPrompt') {
      return new Promise(resolve => {
        finishPrompt = resolve
      })
    }
    return Promise.resolve()
  })

  render(<VisitScreen module={mod} onComplete={vi.fn()} />)
  await flushAudioQueue()
  await act(async () => {
    fireEvent.click(screen.getByTestId('drnour-mask'))
    await Promise.resolve()
  })
  expect(audio.say).toHaveBeenCalledWith('ar', 'visit.stopSignal')
  expect(screen.getByTestId('raise-hand')).toBeDisabled()

  await act(async () => {
    finishStop()
    await Promise.resolve()
  })
  expect(audio.say).toHaveBeenCalledWith('ar', 'visit.handPrompt')
  expect(screen.getByTestId('raise-hand')).toBeDisabled()

  await act(async () => {
    fireEvent.click(screen.getByTestId('raise-hand'))
  })
  expect(screen.queryByTestId('paused-label')).toBeNull()

  await act(async () => {
    finishPrompt()
    await Promise.resolve()
  })
  expect(screen.getByTestId('raise-hand')).not.toBeDisabled()

  await act(async () => {
    fireEvent.click(screen.getByTestId('raise-hand'))
  })
  expect(screen.getByTestId('paused-label')).toBeInTheDocument()
})

test('Arabic simulation uses one narration track with timed visual cues', async () => {
  vi.useFakeTimers()
  useGame.getState().setLang('ar')
  const onComplete = vi.fn()
  const eraseSfx = vi.spyOn(audio, 'playEraseSfx').mockImplementation(() => {})
  let finishSimulation!: () => void
  let finishCountIntro!: () => void
  let finishCountToTen!: () => void
  let finishClean!: () => void
  vi.mocked(audio.say).mockImplementation((_, id) => {
    if (id === 'visit.simulation') {
      return new Promise(resolve => {
        finishSimulation = resolve
      })
    }
    if (id === 'visit.step.count') {
      return new Promise(resolve => {
        finishCountIntro = resolve
      })
    }
    if (id === 'visit.countToTen') {
      return new Promise(resolve => {
        finishCountToTen = resolve
      })
    }
    if (id === 'visit.step.clean') {
      return new Promise(resolve => {
        finishClean = resolve
      })
    }
    return Promise.resolve()
  })

  render(<VisitScreen module={mod} onComplete={onComplete} />)
  await flushAudioQueue()
  await act(async () => {
    fireEvent.click(screen.getByTestId('drnour-mask'))
  })
  await flushAudioQueue()
  await act(async () => {
    fireEvent.click(screen.getByTestId('raise-hand'))
  })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000)
  })
  await flushAudioQueue()

  expect(audio.say).toHaveBeenCalledWith('ar', 'visit.simulation')
  expect(screen.getByTestId('audio-replay')).toBeDisabled()
  expect(screen.getByTestId('visit-frame-chair')).toHaveAttribute('data-active', 'true')

  await act(async () => {
    await vi.advanceTimersByTimeAsync(7540)
  })
  expect(screen.getByText(/كرسي/)).toBeInTheDocument()
  expect(screen.getByTestId('visit-frame-chair')).toHaveAttribute('data-active', 'true')

  await act(async () => {
    await vi.advanceTimersByTimeAsync(8200)
  })
  expect(screen.getByText(/النور/)).toBeInTheDocument()
  expect(screen.getByTestId('visit-frame-light')).toHaveAttribute('data-active', 'true')

  await act(async () => {
    await vi.advanceTimersByTimeAsync(4440)
  })
  expect(screen.getByText(/المراية/)).toBeInTheDocument()
  expect(screen.getByTestId('visit-frame-mirror')).toHaveAttribute('data-active', 'true')

  await act(async () => {
    await vi.advanceTimersByTimeAsync(8560)
  })
  expect(screen.getByText(/العصير/)).toBeInTheDocument()
  expect(screen.getByTestId('visit-frame-sleepy')).toHaveAttribute('data-active', 'true')

  await act(async () => {
    finishSimulation()
    await Promise.resolve()
  })
  expect(audio.say).not.toHaveBeenCalledWith('ar', 'visit.step.count')

  await act(async () => {
    await vi.advanceTimersByTimeAsync(6780)
  })
  expect(audio.say).toHaveBeenCalledWith('ar', 'visit.step.count')
  expect(screen.getByTestId('visit-frame-sleepy')).toHaveAttribute('data-active', 'true')
  expect(screen.getByTestId('visit-frame-count')).not.toHaveAttribute('data-active', 'true')

  await act(async () => {
    finishCountIntro()
    await Promise.resolve()
  })
  expect(audio.say).not.toHaveBeenCalledWith('ar', 'visit.countToTen')

  await act(async () => {
    await vi.advanceTimersByTimeAsync(7480)
  })
  expect(screen.getByTestId('visit-frame-count')).toHaveAttribute('data-active', 'true')
  expect(audio.say).toHaveBeenCalledWith('ar', 'visit.countToTen')

  await act(async () => {
    await vi.advanceTimersByTimeAsync(901)
  })
  expect(audio.say).toHaveBeenCalledWith('ar', 'visit.countToTen')
  expect(screen.getByText(/واحد/)).toBeInTheDocument()
  expect(screen.getByTestId('visit-frame-count')).toHaveAttribute('data-active', 'true')

  await act(async () => {
    await vi.advanceTimersByTimeAsync(7720)
  })
  expect(screen.getByTestId('visit-frame-count-ten')).toHaveAttribute('data-active', 'true')

  await act(async () => {
    finishCountToTen()
    await Promise.resolve()
  })
  expect(audio.say).not.toHaveBeenCalledWith('ar', 'visit.step.clean')

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1517)
  })
  expect(audio.say).toHaveBeenCalledWith('ar', 'visit.step.clean')
  expect(screen.getByTestId('visit-frame-clean')).toHaveAttribute('data-active', 'true')
  expect(onComplete).not.toHaveBeenCalled()

  await act(async () => {
    finishClean()
    await Promise.resolve()
  })
  expect(audio.say).not.toHaveBeenCalledWith('ar', 'visit.done')

  await act(async () => {
    await vi.advanceTimersByTimeAsync(10_219)
  })
  expect(eraseSfx).toHaveBeenCalledTimes(4)
  expect(audio.say).toHaveBeenCalledWith('ar', 'visit.done')
  expect(onComplete).toHaveBeenCalledTimes(1)
})

/** Walk the whole simulation and collect the lines it spoke, in order. */
async function runSimulation() {
  render(<VisitScreen module={mod} onComplete={vi.fn()} />)
  await flushAudioQueue()
  await act(async () => {
    fireEvent.click(screen.getByTestId('drnour-mask'))
  })
  await flushAudioQueue()
  await act(async () => {
    fireEvent.click(screen.getByTestId('raise-hand'))
  })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000)
  })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30_000)
  })
  return vi.mocked(audio.say).mock.calls.map(c => c[1])
}

// Both journeys walk the same six beats. This was briefly split — the sleepy
// juice and the counting on the treatment path only — and the owner's call is
// that every child sees all six, so the test asserts that for each path rather
// than one each way.
for (const path of ['checkup', 'treatment'] as const) {
  test(`the ${path} visit walks all six steps in order`, async () => {
    vi.useFakeTimers()
    useGame.getState().setPath(path)
    const spoken = await runSimulation()

    const steps = [
      'visit.step.chair',
      'visit.step.light',
      'visit.step.mirror',
      'visit.step.sleepy',
      'visit.step.count',
      'visit.step.clean',
    ]
    for (const id of steps) expect(spoken).toContain(id)

    // Order is the part that matters clinically: the sleepy juice goes on
    // before the counting, and the handpiece only after both.
    const spokenSteps = spoken.filter(id => steps.includes(id as string))
    expect(spokenSteps).toEqual(steps)
    const countStart = spoken.indexOf('visit.step.count')
    expect(spoken.slice(countStart + 1, countStart + 11)).toEqual([
      'spray.count.1',
      'spray.count.2',
      'spray.count.3',
      'spray.count.4',
      'spray.count.5',
      'spray.count.6',
      'spray.count.7',
      'spray.count.8',
      'spray.count.9',
      'spray.count.10',
    ])
  })
}
