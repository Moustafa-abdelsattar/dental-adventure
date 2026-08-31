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

test('full flow: mask → stop signal → five steps → complete, exactly once', async () => {
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
    await vi.advanceTimersByTimeAsync(30_000) // five steps auto-advance
  })
  for (const id of [
    'visit.step.chair',
    'visit.step.light',
    'visit.step.mirror',
    'visit.step.sleepy',
    'visit.step.clean',
    'visit.done',
  ])
    expect(audio.say).toHaveBeenCalledWith('en', id)
  expect(audio.say).not.toHaveBeenCalledWith('en', 'visit.step.count')
  for (let n = 1; n <= 10; n++) expect(audio.say).not.toHaveBeenCalledWith('en', `spray.count.${n}`)
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

test('mask cannot be tapped until the dentist intro finishes', async () => {
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
  expect(screen.getByTestId('drnour-mask')).toHaveAttribute('aria-disabled', 'true')

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
  let finishPrompt!: () => void
  vi.mocked(audio.say).mockImplementation((_, id) => {
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
  expect(audio.say).not.toHaveBeenCalledWith('ar', 'visit.stopSignal')
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
  let finishSimulation!: () => void
  let finishClean!: () => void
  vi.mocked(audio.say).mockImplementation((_, id) => {
    if (id === 'visit.simulation') {
      return new Promise(resolve => {
        finishSimulation = resolve
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

// Both journeys walk the same five beats; the countdown is no longer part of
// the visit simulation.
for (const path of ['checkup', 'treatment'] as const) {
  test(`the ${path} visit walks all five steps in order without counting`, async () => {
    vi.useFakeTimers()
    useGame.getState().setPath(path)
    const spoken = await runSimulation()

    const steps = [
      'visit.step.chair',
      'visit.step.light',
      'visit.step.mirror',
      'visit.step.sleepy',
      'visit.step.clean',
    ]
    for (const id of steps) expect(spoken).toContain(id)

    const spokenSteps = spoken.filter(id => steps.includes(id as string))
    expect(spokenSteps).toEqual(steps)
    expect(spoken).not.toContain('visit.step.count')
    expect(spoken).not.toContain('visit.countToTen')
    for (let n = 1; n <= 10; n++) expect(spoken).not.toContain(`spray.count.${n}`)
  })
}
