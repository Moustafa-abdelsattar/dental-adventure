import type { Lang, StringId } from './i18n'

const MUSIC_VOL = 0.25
const DUCK_VOL = 0.08

class AudioController {
  private unlocked = false
  private current: HTMLAudioElement | null = null
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
    this.current?.pause()
    const clip = new Audio(`/audio/${lang}/${id}.mp3`)
    this.current = clip
    this.last = { lang, id }
    if (this.music) this.music.volume = DUCK_VOL
    this.setTalking(true)
    return new Promise(resolve => {
      const finish = () => {
        if (this.music) this.music.volume = MUSIC_VOL
        this.setTalking(false)
        resolve()
      }
      clip.onended = finish
      clip.play().catch(finish)
    })
  }

  replayLast(): Promise<void> {
    return this.last ? this.say(this.last.lang, this.last.id) : Promise.resolve()
  }

  startMusic() {
    if (!this.unlocked || this.music || this.muted) return
    this.music = new Audio('/audio/music.mp3')
    this.music.loop = true
    this.music.volume = MUSIC_VOL
    void this.music.play().catch(() => {
      this.music = null
    })
  }

  setMuted(m: boolean) {
    this.muted = m
    if (m) {
      this.current?.pause()
      this.music?.pause()
    } else {
      void this.music?.play().catch(() => {})
    }
  }

  _resetForTests() {
    this.unlocked = false
    this.current = null
    this.music = null
    this.last = null
    this.muted = false
    this.talkingSubs.clear()
  }
}

export const audio = new AudioController()
