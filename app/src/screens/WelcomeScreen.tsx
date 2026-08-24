import { useEffect, useState } from 'react'
import { useGame, selectStarCount } from '../store/game'
import { t } from '../lib/i18n'
import { audio } from '../lib/audio'
import { FadeIn } from '../components/motion/FadeIn'
import { GameButton } from '../components/ui/GameButton'
import { SpeechBubble } from '../components/ui/SpeechBubble'
import { MiloHero } from '../components/ui/MiloHero'

export function WelcomeScreen({ onStart, onStartOver }: { onStart: () => void; onStartOver?: () => void }) {
  const lang = useGame(s => s.lang)
  const starCount = useGame(selectStarCount)
  const reset = useGame(s => s.reset)
  const returning = starCount > 0
  const [confirmReset, setConfirmReset] = useState(false)

  // parent-facing escape hatch back to language/name setup; two taps to
  // protect a child's progress from one stray tap
  const startOver = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      setTimeout(() => setConfirmReset(false), 4000)
      return
    }
    reset()
    onStartOver?.()
  }

  useEffect(() => {
    if (lang) void audio.say(lang, returning ? 'milo.welcomeBack' : 'milo.welcome')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!lang) return null
  return (
    <div className="min-h-[var(--app-h)] flex flex-col items-center justify-center gap-5 px-6">
      <FadeIn className="text-center">
        <h1 className="text-5xl font-bold leading-tight bg-gradient-to-b from-sky-deep to-grape bg-clip-text text-transparent drop-shadow-sm">
          {t(lang, 'app.title')}
        </h1>
        <p className="inline-flex items-center gap-1.5 mt-2 rounded-full bg-white/70 px-4 py-1 text-base text-ink/70 font-bold shadow-sm">
          <img src="/art/star.svg" alt="" className="w-4 select-none" draggable={false} />
          {t(lang, 'app.subtitle')}
        </p>
      </FadeIn>
      <MiloHero />
      <SpeechBubble stringId={returning ? 'milo.welcomeBack' : 'milo.welcome'} />
      <FadeIn delay={0.25} className="w-full max-w-xs flex flex-col" data-testid="start-adventure">
        <GameButton label={t(lang, 'ui.start')} pulsing onPress={onStart} />
      </FadeIn>
      <FadeIn delay={0.5}>
        <button
          data-testid="start-over"
          onClick={startOver}
          className={`min-h-11 px-4 text-sm font-bold underline underline-offset-4 ${confirmReset ? 'text-bubblegum' : 'text-ink/40'}`}
        >
          {t(lang, confirmReset ? 'ui.startOverConfirm' : 'ui.startOver')}
        </button>
      </FadeIn>
    </div>
  )
}
