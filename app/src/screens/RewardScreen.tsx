import { useGame } from '../store/game'
import { t } from '../lib/i18n'

/** Minimal placeholder — fleshed out with celebration + certificate in Task 13. */
export function RewardScreen() {
  const lang = useGame(s => s.lang)
  const childName = useGame(s => s.childName)
  if (!lang) return null
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center" data-testid="reward-screen">
      <h1 className="text-4xl font-bold">{t(lang, 'reward.congrats', { name: childName })}</h1>
      <p className="text-2xl font-bold text-grape">{t(lang, 'reward.hero')}</p>
    </div>
  )
}
