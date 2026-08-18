import type { Lang, StringId } from './i18n'

const MUSIC_VOL = 0.25
const DUCK_VOL = 0.08

class AudioController {
  private unlocked = false
  private current: HTMLAudioElement | null = null
  /** Settles the in-flight line's promise. Held so an interruption can end it. */
  private settleCurrent: (() => void) | null = null
  private music: HTMLAudioElement | null = null
  private last: { lang: Lang; id: StringId } | null = null
  private muted = false
  private talkingSubs = new Set<(talking: boolean) => void>()

  unlock() {
    this.unlocked = true
  }

  onTalkingChange(cb: (t: boolean) => void) {
    this.talkingSubs.add(cb)
    return () => {
      this.talkingSubs.delete(cb)
    }
  }

  private setTalking(t: boolean) {
    this.talkingSubs.forEach(cb => cb(t))
  }

  say(lang: Lang, id: StringId): Promise<void> {
    if (!this.unlocked || this.muted) return Promise.resolve()
    // Whatever was talking is over, one way or another. Cutting it off has to
    // settle its promise as well as stop the sound: screens await a line and
    // then act on it — the clinic will not finish its module until the last
    // line resolves — and a child taps over narration constantly.
    this.cutOff()
    const clip = new Audio(`/audio/${lang}/${id}.mp3`)
    this.current = clip
    this.last = { lang, id }
    if (this.music) this.music.volume = DUCK_VOL
    this.setTalking(true)
    return new Promise(resolve => {
      let settled = false
      const settle = () => {
        if (settled) return
        settled = true
        // Only the line that is still the current one may put the room back:
        // an interrupted line handing the music back would raise it under the
        // line that replaced it, and would drop Milo's mouth mid-sentence.
        if (this.current === clip) {
          this.current = null
          this.settleCurrent = null
          if (this.music) this.music.volume = MUSIC_VOL
          this.setTalking(false)
        }
        resolve()
      }
      this.settleCurrent = settle
      clip.onended = settle
      // A clip that will not load must not hold the screen: no narration is
      // survivable, a screen that never advances is not.
      clip.onerror = settle
      // play() may return undefined in some environments (jsdom, old browsers)
      Promise.resolve(clip.play()).catch(settle)
    })
  }

  /**
   * Silence whatever is talking, and release its waiter.
   *
   * The order matters: the clip stops being current before it is settled, so
   * the settle sees itself as stale and leaves the music ducked for the line
   * about to replace it. `stop()` is the exception — nothing follows it, so it
   * lifts the music itself.
   */
  private cutOff() {
    const settle = this.settleCurrent
    this.current?.pause()
    this.current = null
    this.settleCurrent = null
    settle?.()
  }

  /** Nothing more to say: stop the line and let the music back up. */
  stop() {
    const wasTalking = this.current !== null
    this.cutOff()
    if (wasTalking) {
      if (this.music) this.music.volume = MUSIC_VOL
      this.setTalking(false)
    }
  }

  replayLast(): Promise<void> {
    return this.last ? this.say(this.last.lang, this.last.id) : Promise.resolve()
  }

  startMusic() {
    if (!this.unlocked || this.music || this.muted) return
    this.music = new Audio('/audio/music.mp3')
    this.music.loop = true
    this.music.volume = MUSIC_VOL
    void Promise.resolve(this.music.play()).catch(() => {
      this.music = null
    })
  }

  setMuted(m: boolean) {
    this.muted = m
    if (m) {
      // stop() rather than a bare pause: muting mid-sentence used to leave the
      // waiting screen holding a promise that could never settle, and the music
      // ducked for the rest of the session once it was unmuted.
      this.stop()
      this.music?.pause()
    } else if (this.music) {
      this.music.volume = MUSIC_VOL
      void Promise.resolve(this.music.play()).catch(() => {})
    }
  }

  _resetForTests() {
    this.unlocked = false
    this.current = null
    this.settleCurrent = null
    this.music = null
    this.last = null
    this.muted = false
    this.talkingSubs.clear()
  }
}

export const audio = new AudioController()
