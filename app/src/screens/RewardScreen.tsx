import { useEffect, useState } from 'react'
import { useGame } from '../store/game'
import { t } from '../lib/i18n'
import { audio } from '../lib/audio'
import { renderCertificate } from '../lib/certificate'
import { motion } from 'motion/react'
import { Floating } from '../components/motion/Floating'
import { FadeIn } from '../components/motion/FadeIn'
import { Pop } from '../components/motion/Pop'
import { StarBurst } from '../components/motion/StarBurst'
import { GameButton } from '../components/ui/GameButton'

/** The Dental Hero celebration: bursts, narration, certificate actions, free-play. */
export function RewardScreen({ onPlayAgain }: { onPlayAgain?: () => void }) {
  const lang = useGame(s => s.lang)
  const childName = useGame(s => s.childName)
  const startFreePlay = useGame(s => s.startFreePlay)
  const playAgain = onPlayAgain ?? startFreePlay
  const [bursts, setBursts] = useState([false, false, false])

  useEffect(() => {
    if (!lang) return
    void audio.say(lang, 'reward.narration')
    const timers = [0, 350, 700].map((d, i) => setTimeout(() => setBursts(b => b.map((v, j) => (j === i ? true : v)) as typeof b), d))
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!lang) return null

  const makeCertificate = () => renderCertificate({ name: childName, lang, date: new Date() })

  const share = async () => {
    const blob = await makeCertificate()
    const file = new File([blob], 'dental-hero.png', { type: 'image/png' })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: t(lang, 'cert.title') }).catch(() => {})
    } else {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'dental-hero.png'
      a.click()
      URL.revokeObjectURL(a.href)
    }
  }

  const print = async () => {
    const blob = await makeCertificate()
    const url = URL.createObjectURL(blob)
    const win = window.open(url)
    win?.addEventListener('load', () => win.print())
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-5 px-6 text-center relative overflow-hidden" data-testid="reward-screen">
      <div className="absolute inset-0 bg-gradient-to-b from-grape/25 via-transparent to-sunny/20 pointer-events-none" />
      {bursts.map((show, i) => (
        <div key={i} className={`absolute ${['top-1/4 start-1/4', 'top-1/3 end-1/4', 'top-1/2 start-1/2'][i]}`}>
          <StarBurst show={show} size={70} />
        </div>
      ))}

      <Pop>
        <div className="flex gap-1 text-4xl" data-testid="reward-stars">
          {'⭐⭐⭐⭐⭐'}
        </div>
      </Pop>
      <Floating>
        <motion.img
          src="/art/milo-celebrate.webp"
          alt="Milo celebrating"
          draggable={false}
          className="w-52 select-none drop-shadow-lg cursor-pointer"
          onClick={() => void audio.replayLast()}
          animate={{ rotate: [-2, 2, -2] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </Floating>
      <FadeIn>
        <h1 className="text-4xl font-bold">{t(lang, 'reward.congrats', { name: childName })}</h1>
        <p className="text-2xl font-bold text-grape mt-1">{t(lang, 'reward.hero')}</p>
      </FadeIn>

      <FadeIn delay={0.3} className="flex flex-col gap-3 w-full max-w-xs">
        <GameButton label={t(lang, 'ui.shareCertificate')} onPress={() => void share()} />
        <GameButton label={t(lang, 'ui.printCertificate')} variant="ghost" onPress={() => void print()} />
        <GameButton label={t(lang, 'ui.playAgain')} variant="mint" onPress={playAgain} />
      </FadeIn>
    </div>
  )
}
