import { useEffect, lazy, Suspense } from 'react'
import { useGame, selectStarCount } from '../store/game'
import { t } from '../lib/i18n'
import { audio } from '../lib/audio'
import { Floating } from '../components/motion/Floating'
import { audio as audioCtl } from '../lib/audio'

function MiloArt() {
  return (
    <Floating>
      <img
        src="/art/milo.webp"
        alt="Milo the Tooth"
        draggable={false}
        className="w-52 select-none drop-shadow-lg cursor-pointer"
        onClick={() => void audioCtl.replayLast()}
      />
    </Floating>
  )
}
import { FadeIn } from '../components/motion/FadeIn'
import { GameButton } from '../components/ui/GameButton'
import { SpeechBubble } from '../components/ui/SpeechBubble'
import { SafeBoundary } from '../components/ui/SafeBoundary'

// 3D hero moment — lazy so the first paint stays instant; devices without
// WebGL (or while the chunk loads) get the 2D Milo instead.
const MiloTooth3D = lazy(() => import('../three/MiloTooth3D'))

export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const lang = useGame(s => s.lang)
  const starCount = useGame(selectStarCount)
  const returning = starCount > 0

  useEffect(() => {
    if (lang) void audio.say(lang, returning ? 'milo.welcomeBack' : 'milo.welcome')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!lang) return null
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6">
      <FadeIn className="text-center">
        <h1 className="text-5xl font-bold text-sky-deep drop-shadow-sm leading-tight">{t(lang, 'app.title')}</h1>
        <p className="text-lg text-ink/60 font-bold mt-1">{t(lang, 'app.subtitle')}</p>
      </FadeIn>
      <SafeBoundary fallback={<MiloArt />}>
        <Suspense fallback={<MiloArt />}>
          <MiloTooth3D />
        </Suspense>
      </SafeBoundary>
      <SpeechBubble stringId={returning ? 'milo.welcomeBack' : 'milo.welcome'} />
      <FadeIn delay={0.25} className="w-full max-w-xs">
        <GameButton label={t(lang, 'ui.start')} pulsing onPress={onStart} />
      </FadeIn>
    </div>
  )
}
