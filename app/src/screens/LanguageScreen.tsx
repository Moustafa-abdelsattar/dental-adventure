import { motion } from 'motion/react'
import { springs } from '../lib/springs'
import { audio } from '../lib/audio'
import { useGame } from '../store/game'
import type { Lang } from '../lib/i18n'
import { FadeIn } from '../components/motion/FadeIn'
import { MiloHero } from '../components/ui/MiloHero'

/**
 * First screen: two big self-voicing language buttons.
 * Each button speaks its own greeting in its own language when tapped,
 * so a pre-reader hears the choice confirmed immediately.
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
    <div className="min-h-dvh flex flex-col items-center justify-center gap-8 px-6">
      <MiloHero size={185} draggable={false} />
      <FadeIn className="flex flex-col items-center gap-1">
        <span className="text-2xl font-bold" dir="rtl" lang="ar" style={{ fontFamily: 'var(--font-display-ar)' }}>
          اختر اللغة
        </span>
        <span className="text-2xl font-bold" lang="en">
          Choose language
        </span>
      </FadeIn>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <motion.button
          whileTap={{ scale: 0.96 }}
          transition={springs.snappy}
          onClick={() => choose('ar')}
          lang="ar"
          dir="rtl"
          className="min-h-[84px] rounded-full bg-sky-deep text-white text-3xl font-bold shadow-lg"
          style={{ fontFamily: 'var(--font-display-ar)' }}
        >
          العربية
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          transition={springs.snappy}
          onClick={() => choose('en')}
          lang="en"
          className="min-h-[84px] rounded-full bg-mint text-white text-3xl font-bold shadow-lg"
        >
          English
        </motion.button>
      </div>
    </div>
  )
}
