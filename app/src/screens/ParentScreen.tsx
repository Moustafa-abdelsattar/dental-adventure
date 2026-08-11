import { useState } from 'react'
import { useGame } from '../store/game'
import { t } from '../lib/i18n'
import { GameButton } from '../components/ui/GameButton'
import { NameInput } from '../components/ui/NameInput'
import { FadeIn } from '../components/motion/FadeIn'
import { Pop } from '../components/motion/Pop'

/**
 * Parent-facing moment: pick the visit type (skipped when preset via ?visit=)
 * and optionally enter the child's name.
 */
export function ParentScreen({ onDone }: { onDone: () => void }) {
  const { lang, path, setPath, childName, setChildName } = useGame()
  const [step, setStep] = useState<'visit' | 'name'>(path ? 'name' : 'visit')
  const [name, setName] = useState(childName)
  if (!lang) return null

  const finish = (save: boolean) => {
    if (save) setChildName(name)
    onDone()
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6">
      <FadeIn>
        <span className="rounded-full bg-grape/15 text-grape px-4 py-1 text-sm font-bold uppercase tracking-wide">
          {t(lang, 'parent.forParents')}
        </span>
      </FadeIn>

      {step === 'visit' ? (
        <>
          <h1 className="text-3xl font-bold text-center">{t(lang, 'parent.whichVisit')}</h1>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <Pop>
              <GameButton
                icon={<span className="text-3xl">🪥</span>}
                label={t(lang, 'parent.checkup')}
                variant="mint"
                onPress={() => {
                  setPath('checkup')
                  setStep('name')
                }}
              />
            </Pop>
            <Pop delay={0.08}>
              <GameButton
                icon={<span className="text-3xl">⭐</span>}
                label={t(lang, 'parent.treatment')}
                variant="primary"
                onPress={() => {
                  setPath('treatment')
                  setStep('name')
                }}
              />
            </Pop>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold text-center">{t(lang, 'parent.childName')}</h1>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <NameInput value={name} onChange={setName} placeholder={t(lang, 'parent.namePlaceholder')} />
            <GameButton label={t(lang, 'ui.next')} onPress={() => finish(true)} />
            <GameButton label={t(lang, 'parent.skip')} variant="ghost" onPress={() => finish(false)} />
          </div>
        </>
      )}
    </div>
  )
}
