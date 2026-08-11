import { useEffect, useState } from 'react'
import { useGame, initFromUrl } from './store/game'
import { dirFor } from './lib/i18n'
import { audio } from './lib/audio'
import { Backdrop } from './components/ui/Backdrop'
import { LanguageScreen } from './screens/LanguageScreen'
import { ParentScreen } from './screens/ParentScreen'
import { WelcomeScreen } from './screens/WelcomeScreen'
import { ModuleHost } from './screens/ModuleHost'
import { ProgressHud } from './components/ui/ProgressHud'

export default function App() {
  const lang = useGame(s => s.lang)
  const path = useGame(s => s.path)
  const [parentDone, setParentDone] = useState(false)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    initFromUrl(location.search)
  }, [])

  useEffect(() => {
    if (lang) {
      document.documentElement.dir = dirFor(lang)
      document.documentElement.lang = lang
    }
  }, [lang])

  useEffect(() => {
    const unlock = () => {
      audio.unlock()
      audio.startMusic()
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  let screen
  if (!lang) screen = <LanguageScreen />
  else if (!path || !parentDone) screen = <ParentScreen onDone={() => setParentDone(true)} />
  else if (!started) screen = <WelcomeScreen onStart={() => setStarted(true)} />
  else
    screen = (
      <>
        <ProgressHud />
        <ModuleHost />
      </>
    )

  return (
    <>
      <Backdrop />
      <div className="relative">{screen}</div>
    </>
  )
}
