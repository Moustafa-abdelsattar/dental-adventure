import { useEffect, useState } from 'react'
import { useGame } from '../store/game'
import { t } from '../lib/i18n'
import { audio } from '../lib/audio'
import { renderCertificate } from '../lib/certificate'
import { motion } from 'motion/react'
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
  const [certificateDate] = useState(() => new Date())

  useEffect(() => {
    if (!lang) return
    void audio.say(lang, 'reward.narration')
    const timers = [0, 350, 700].map((d, i) => setTimeout(() => setBursts(b => b.map((v, j) => (j === i ? true : v)) as typeof b), d))
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!lang) return null

  const displayName = childName.trim() || t(lang, 'cert.defaultName')
  const makeCertificate = () => renderCertificate({ name: childName, lang, date: certificateDate })

  const share = async () => {
    const blob = await makeCertificate()
    const fileName = certificateFileName(displayName)
    const file = new File([blob], fileName, { type: 'image/png' })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: t(lang, 'cert.title') }).catch(() => {})
    } else {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = fileName
      a.click()
      URL.revokeObjectURL(a.href)
    }
  }

  const print = async () => {
    const blob = await makeCertificate()
    const url = URL.createObjectURL(blob)
    const win = window.open('', '_blank')
    if (!win) {
      const a = document.createElement('a')
      a.href = url
      a.download = certificateFileName(displayName)
      a.click()
      return
    }
    win.document.write(printHtml(url, t(lang, 'cert.title')))
    win.document.close()
    win.addEventListener('load', () => {
      win.focus()
      win.print()
      setTimeout(() => URL.revokeObjectURL(url), 3000)
    })
  }

  return (
    <div
      className="h-[var(--app-h)] overflow-y-auto px-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-[calc(var(--hud-h)+0.75rem)] text-center relative"
      data-testid="reward-screen"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-grape/25 via-transparent to-sunny/20 pointer-events-none" />
      {bursts.map((show, i) => (
        <div key={i} className={`absolute ${['top-1/4 start-1/4', 'top-1/3 end-1/4', 'top-1/2 start-1/2'][i]}`}>
          <StarBurst show={show} size={70} />
        </div>
      ))}

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-sm flex-col items-center gap-3">
        <div className="flex gap-1.5" data-testid="reward-stars">
          {Array.from({ length: 5 }, (_, i) => (
            <Pop key={i} delay={0.15 + i * 0.12}>
              <img
                src="/art/star.svg"
                alt=""
                draggable={false}
                className="w-8 select-none drop-shadow-[0_0_8px_rgba(255,212,94,0.9)]"
              />
            </Pop>
          ))}
        </div>

        <FadeIn className="flex w-full items-center justify-center gap-3">
          <motion.img
            src="/art/milo-celebrate.webp"
            alt="Milo celebrating"
            draggable={false}
            className="w-20 select-none drop-shadow-lg cursor-pointer"
            onClick={() => void audio.replayLast()}
            animate={{ rotate: [-2, 2, -2] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="text-start">
            <h1 className="text-3xl font-bold leading-tight">{t(lang, 'reward.congrats', { name: childName })}</h1>
            <p className="text-xl font-bold leading-tight text-grape">{t(lang, 'reward.hero')}</p>
          </div>
        </FadeIn>

        <CertificatePreview lang={lang} name={displayName} date={certificateDate} />

        {/* the shared ending of Milo's arc: child + Milo earned this together */}
        <FadeIn delay={0.2}>
          <span
            data-testid="shared-badge"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-base font-bold text-ink shadow-md"
          >
            <img src="/art/milo.webp" alt="" draggable={false} className="w-7 select-none" />
            {t(lang, 'story.together')}
          </span>
        </FadeIn>

        <FadeIn delay={0.3} className="flex w-full max-w-xs flex-col gap-2 pb-2">
          <GameButton label={t(lang, 'ui.shareCertificate')} onPress={() => void share()} />
          <GameButton label={t(lang, 'ui.printCertificate')} variant="ghost" onPress={() => void print()} />
          <GameButton label={t(lang, 'ui.playAgain')} variant="mint" onPress={playAgain} />
        </FadeIn>
      </div>
    </div>
  )
}

function CertificatePreview({ lang, name, date }: { lang: 'en' | 'ar'; name: string; date: Date }) {
  return (
    <FadeIn delay={0.12} className="w-full">
      <div
        className="relative mx-auto aspect-[2480/3508] max-h-[18rem] w-full max-w-[12.5rem] overflow-hidden rounded-[1.1rem] border-[3px] border-[#d9a94a] bg-cream px-4 py-4 shadow-xl shadow-ink/15"
        aria-label={t(lang, 'cert.title')}
        data-testid="certificate-preview"
      >
        <div className="pointer-events-none absolute inset-2 rounded-[0.8rem] border border-[#d9a94a]/70" />
        <div className="relative flex h-full flex-col items-center">
          <div className="rounded-full bg-sky-deep px-4 py-1.5 text-[0.7rem] font-bold leading-none text-white">
            DENTAL HERO
          </div>
          <p className="mt-3 text-[0.92rem] font-bold leading-tight text-grape">{t(lang, 'cert.title')}</p>
          <img
            src="/art/milo-celebrate.webp"
            alt=""
            draggable={false}
            className="mt-2 h-16 w-16 select-none object-contain drop-shadow-md"
          />
          <p className="mt-2 text-[0.72rem] font-bold text-ink">{t(lang, 'cert.awardedTo')}</p>
          <p className="mt-0.5 min-h-7 w-full overflow-hidden text-ellipsis whitespace-nowrap border-b-2 border-[#d9a94a] px-2 pb-1 text-center text-[1.35rem] font-bold leading-none text-sky-deep">
            {name}
          </p>
          <p className="mt-2 max-w-[9rem] overflow-hidden text-ellipsis whitespace-nowrap text-[0.65rem] font-bold leading-tight text-ink">{t(lang, 'cert.for')}</p>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <img key={i} src="/art/star.svg" alt="" draggable={false} className="h-4 w-4 select-none" />
            ))}
          </div>
          <div className="mt-auto rounded-full bg-sky-deep px-4 py-2 text-center text-[0.64rem] font-bold leading-none text-white">
            <span className="block">DENTAL</span>
            <span className="block">HERO</span>
          </div>
          <p className="mt-2 text-[0.68rem] font-bold text-ink">
            {date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB')}
          </p>
        </div>
      </div>
    </FadeIn>
  )
}

function certificateFileName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `dental-hero-${slug || 'certificate'}.png`
}

function printHtml(src: string, title: string) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
@page { size: portrait; margin: 0.25in; }
html, body { margin: 0; min-height: 100%; background: #ffffff; }
body {
  display: flex;
  align-items: center;
  justify-content: center;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}
img {
  display: block;
  width: 100%;
  max-width: calc(100vw - 0.5in);
  max-height: calc(100vh - 0.5in);
  object-fit: contain;
}
@media print {
  body { min-height: auto; }
  img { width: 100%; height: auto; }
}
</style>
</head>
<body>
<img src="${src}" alt="${escapeHtml(title)}">
</body>
</html>`
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
}
