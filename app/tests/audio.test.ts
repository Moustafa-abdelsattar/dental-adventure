import { audio, __resetAudioPrimingForTests } from '../src/lib/audio'

class FakeAudio {
  static instances: FakeAudio[] = []
  src: string
  paused = true
  loop = false
  volume = 1
  onended: (() => void) | null = null
  constructor(src: string) {
    this.src = src
    FakeAudio.instances.push(this)
  }
  play() {
    this.paused = false
    return Promise.resolve()
  }
  pause() {
    this.paused = true
  }
}

beforeEach(() => {
  FakeAudio.instances = []
  vi.stubGlobal('Audio', FakeAudio)
  audio._resetForTests()
})

test('say builds the right src and interrupts previous clip', () => {
  audio.unlock()
  void audio.say('ar', 'milo.welcome')
  const first = FakeAudio.instances.at(-1)!
  expect(first.src).toBe('/audio/ar/milo.welcome.mp3')
  void audio.say('ar', 'clinic.intro')
  expect(first.paused).toBe(true)
})

test('does nothing before unlock', () => {
  void audio.say('en', 'milo.great')
  expect(FakeAudio.instances).toHaveLength(0)
})

test('replayLast replays the last id', () => {
  audio.unlock()
  void audio.say('en', 'milo.great')
  void audio.replayLast()
  const srcs = FakeAudio.instances.map(a => a.src)
  expect(srcs.filter(s => s.endsWith('milo.great.mp3'))).toHaveLength(2)
})

test('Arabic decay-removal SFX uses the recorded clip without changing last narration', () => {
  audio.unlock()
  void audio.say('ar', 'prepare.step.brush')
  audio.playDecayRemovalSfx()
  expect(FakeAudio.instances.at(-1)!.src).toBe('/audio/ar/decay-removal-sfx.mp3')

  void audio.replayLast()
  expect(FakeAudio.instances.at(-1)!.src).toBe('/audio/ar/prepare.step.brush.mp3')
})

test('music ducks under narration and recovers on clip end', () => {
  audio.unlock()
  audio.startMusic()
  const music = FakeAudio.instances.find(a => a.loop)!
  expect(music.volume).toBeCloseTo(0.25)
  void audio.say('en', 'milo.great')
  expect(music.volume).toBeCloseTo(0.08)
  FakeAudio.instances.at(-1)!.onended?.()
  expect(music.volume).toBeCloseTo(0.25)
})

test('talking state toggles around a clip', () => {
  audio.unlock()
  const states: boolean[] = []
  audio.onTalkingChange(t => states.push(t))
  void audio.say('en', 'milo.great')
  FakeAudio.instances.at(-1)!.onended?.()
  expect(states).toEqual([true, false])
})

// Safari on iOS only plays sound a gesture started, and every screen after the
// language picker speaks from an effect. A returning child never touches the
// language screen, so without a real play inside the unlocking gesture they
// hear nothing all session.
test('unlock plays a silent primer inside the gesture, once', async () => {
  __resetAudioPrimingForTests()
  FakeAudio.instances = []

  audio.unlock()
  const primers = FakeAudio.instances.filter(a => a.src.startsWith('data:audio/wav'))
  expect(primers).toHaveLength(1)
  expect(primers[0].volume, 'silent, so nobody hears the thing that unlocks the sound').toBe(0)
  // play() is called inside the gesture; the stop rides on its promise
  expect(primers[0].paused).toBe(false)
  await Promise.resolve()
  expect(primers[0].paused, 'and it is stopped again straight after').toBe(true)

  audio.unlock()
  expect(
    FakeAudio.instances.filter(a => a.src.startsWith('data:audio/wav')),
    'priming twice would cut off whatever is already speaking',
  ).toHaveLength(1)
})
