import type { Lang, StringId } from './i18n'

const MUSIC_VOL = 0.25
const DUCK_VOL = 0.08

class AudioController {
  private unlocked = false
  private current: HTMLAudioElement | null = null
  /** Settles the in-flight line's promise. Held so an interruption can end it. */
  private settleCurrent: (() => void) | null = null
  private music: HTMLAudioElement | null = null
  private sfxContext: AudioContext | null = null
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

  private getSfxContext() {
    if (!this.unlocked || this.muted) return

    const AudioContextCtor =
      window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextCtor) return

    try {
      const ctx = this.sfxContext ?? new AudioContextCtor()
      this.sfxContext = ctx
      if (ctx.state === 'suspended') void ctx.resume()
      return ctx
    } catch {
      return
    }
  }

  playEraseSfx() {
    const ctx = this.getSfxContext()
    if (!ctx) return

    try {
      const start = ctx.currentTime + 0.01
      const duration = 0.2
      const out = ctx.createGain()
      out.gain.setValueAtTime(0.0001, start)
      out.gain.exponentialRampToValueAtTime(0.16, start + 0.025)
      out.gain.exponentialRampToValueAtTime(0.0001, start + duration)
      out.connect(ctx.destination)

      const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        const fade = 1 - i / data.length
        data[i] = (Math.random() * 2 - 1) * fade
      }

      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      const bandpass = ctx.createBiquadFilter()
      bandpass.type = 'bandpass'
      bandpass.frequency.setValueAtTime(1800, start)
      bandpass.Q.setValueAtTime(2.2, start)
      noise.connect(bandpass)
      bandpass.connect(out)
      noise.start(start)
      noise.stop(start + duration)

      const ping = ctx.createOscillator()
      const pingGain = ctx.createGain()
      ping.type = 'sine'
      ping.frequency.setValueAtTime(2900, start + 0.035)
      ping.frequency.exponentialRampToValueAtTime(4100, start + 0.14)
      pingGain.gain.setValueAtTime(0.0001, start + 0.035)
      pingGain.gain.exponentialRampToValueAtTime(0.045, start + 0.055)
      pingGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16)
      ping.connect(pingGain)
      pingGain.connect(out)
      ping.start(start + 0.035)
      ping.stop(start + 0.17)

      window.setTimeout(() => out.disconnect(), Math.ceil(duration * 1000) + 80)
    } catch {
      // SFX are decorative; narration and progression should never depend on them.
    }
  }

  playStarSfx() {
    const ctx = this.getSfxContext()
    if (!ctx) return

    try {
      const start = ctx.currentTime + 0.01
      const out = ctx.createGain()
      out.gain.setValueAtTime(0.0001, start)
      out.gain.exponentialRampToValueAtTime(0.2, start + 0.03)
      out.gain.exponentialRampToValueAtTime(0.0001, start + 0.62)
      out.connect(ctx.destination)

      const chimes = [0, 0.08, 0.18]
      chimes.forEach((delay, i) => {
        const pingStart = start + delay
        const ping = ctx.createOscillator()
        const pingGain = ctx.createGain()
        ping.type = 'triangle'
        ping.frequency.setValueAtTime([1568, 2093, 2637][i], pingStart)
        pingGain.gain.setValueAtTime(0.0001, pingStart)
        pingGain.gain.exponentialRampToValueAtTime([0.13, 0.1, 0.08][i], pingStart + 0.025)
        pingGain.gain.exponentialRampToValueAtTime(0.0001, pingStart + 0.22)
        ping.connect(pingGain)
        pingGain.connect(out)
        ping.start(pingStart)
        ping.stop(pingStart + 0.24)
      })

      window.setTimeout(() => out.disconnect(), 720)
    } catch {
      // SFX are decorative; narration and progression should never depend on them.
    }
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
    this.sfxContext = null
    this.last = null
    this.muted = false
    this.talkingSubs.clear()
  }
}

export const audio = new AudioController()
