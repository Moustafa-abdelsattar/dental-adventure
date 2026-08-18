import { audio } from '../src/lib/audio'

/**
 * What happens to a line that gets cut off.
 *
 * Narration is interrupted constantly in this game: a child taps the next thing
 * while Milo is still talking, a card opens over a hint, a screen hands over
 * mid-sentence. Every one of those starts a new clip on top of an old one, so
 * the handling of the old one is not an edge case — it is the common case, and
 * it has to leave the music and the waiting screen in a sane state.
 */
class FakeAudio {
  static instances: FakeAudio[] = []
  src: string
  paused = true
  loop = false
  volume = 1
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
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

const last = () => FakeAudio.instances.at(-1)!
const music = () => FakeAudio.instances.find(a => a.loop)!

beforeEach(() => {
  FakeAudio.instances = []
  vi.stubGlobal('Audio', FakeAudio)
  audio._resetForTests()
  audio.unlock()
})

test('a line that is cut off still releases whoever was waiting on it', async () => {
  // ToolsScreen and ClinicScreen both do `await say(a); await say(b)`, and
  // ClinicScreen gates the module's completion on the last one. A promise that
  // never settles strands the child on the screen.
  let finished = false
  const speaking = audio.say('en', 'clinic.chair.desc').then(() => {
    finished = true
  })
  void audio.say('en', 'milo.hint.tap')
  await speaking
  expect(finished).toBe(true)
})

test('the music comes back up after a line is cut short', async () => {
  audio.startMusic()
  expect(music().volume).toBeCloseTo(0.25)

  void audio.say('en', 'clinic.chair.desc')
  expect(music().volume).toBeCloseTo(0.08)

  // interrupted by the next line, which then plays out to its end
  void audio.say('en', 'milo.hint.tap')
  expect(music().volume).toBeCloseTo(0.08)
  last().onended?.()
  await Promise.resolve()
  expect(music().volume).toBeCloseTo(0.25)
})

test('stopping mid-line puts the music back', async () => {
  audio.startMusic()
  void audio.say('en', 'clinic.chair.desc')
  expect(music().volume).toBeCloseTo(0.08)
  audio.stop()
  expect(music().volume).toBeCloseTo(0.25)
  expect(last().paused).toBe(true)
})

test('talking ends exactly once when a line is interrupted', async () => {
  const states: boolean[] = []
  audio.onTalkingChange(t => states.push(t))
  void audio.say('en', 'clinic.chair.desc')
  void audio.say('en', 'milo.hint.tap')
  last().onended?.()
  // true for the first line, true again for the second, false once at the end —
  // never false in the middle, which would drop Milo's mouth for a frame
  expect(states).toEqual([true, true, false])
})

test('a clip that fails to load does not strand the caller', async () => {
  let finished = false
  const speaking = audio.say('en', 'clinic.chair.desc').then(() => {
    finished = true
  })
  last().onerror?.()
  await speaking
  expect(finished).toBe(true)
})
