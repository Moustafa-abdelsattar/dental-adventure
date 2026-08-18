import { motion } from 'motion/react'
import { springs, STAGGER } from '../motion/springs'
import { audio } from '../lib/audio'
import { useGame } from '../store/game'
import type { Lang } from '../lib/i18n'
import { FadeIn } from '../components/motion/FadeIn'
import { MiloHero } from '../components/ui/MiloHero'

/**
 * First screen: two big self-voicing language buttons.
 * Each button speaks its own greeting in its own language when tapped,
 * so a pre-reader hears the choice confirmed immediately.
 *
 * The screen arrives in the order a child should read it: Milo lands first and
 * takes the eye, the question follows, then the two answers a beat apart. It
 * used to be Milo springing in while the words and both buttons were simply
 * there already, which reads as a half-loaded page — the one impression this
 * screen cannot afford to make, since it is the first thing anyone sees.
 */
export function LanguageScreen() {
  const setLang = useGame(s => s.setLang)

  const choose = (lang: Lang) => {
    audio.unlock()
    setLang(lang)
    void audio.say(lang, 'lang.greet')
    audio.startMusic()
  }

  return (
    <div className="min-h-[var(--app-h)] flex flex-col items-center justify-center gap-8 px-6">
      <MiloHero size={185} draggable={false} />
      <FadeIn delay={STAGGER} className="flex flex-col items-center gap-1">
        <span className="text-2xl font-bold" dir="rtl" lang="ar" style={{ fontFamily: 'var(--font-display-ar)' }}>
          اختر اللغة
        </span>
        <span className="text-2xl font-bold" lang="en">
          Choose language
        </span>
      </FadeIn>
      {/* The wrapper carries the entrance and the button keeps its own snappy
          tap: one element cannot hold two transitions, and a button that
          inherits the arrival spring answers a press like treacle. */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <FadeIn delay={STAGGER * 2} className="w-full">
          <motion.button
            whileTap={{ scale: 0.96 }}
            transition={springs.snappy}
            onClick={() => choose('ar')}
            lang="ar"
            dir="rtl"
            className="w-full min-h-[84px] rounded-full bg-sky-deep text-white text-3xl font-bold shadow-lg"
            style={{ fontFamily: 'var(--font-display-ar)' }}
          >
            العربية
          </motion.button>
        </FadeIn>
        <FadeIn delay={STAGGER * 3} className="w-full">
          <motion.button
            whileTap={{ scale: 0.96 }}
            transition={springs.snappy}
            onClick={() => choose('en')}
            lang="en"
            className="w-full min-h-[84px] rounded-full bg-mint text-white text-3xl font-bold shadow-lg"
          >
            English
          </motion.button>
        </FadeIn>
      </div>
    </div>
  )
}
