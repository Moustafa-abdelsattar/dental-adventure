import { useEffect, useState } from 'react'
import { useGame, initFromUrl } from './store/game'
import { dirFor } from './lib/i18n'
import { audio } from './lib/audio'
import { Backdrop } from './components/ui/Backdrop'
import { LanguageScreen } from './screens/LanguageScreen'
import { ParentScreen } from './screens/ParentScreen'
import { WelcomeScreen } from './screens/WelcomeScreen'
import { ModuleHost } from './screens/ModuleHost'
import { HUD } from './game/HUD'

export default function App() {
  const lang = useGame(s => s.lang)
  const path = useGame(s => s.path)
  // a returning child (any star already earned) skips the parent moment and resumes
  const [parentDone, setParentDone] = useState(
    () => useGame.getState().path !== null && Object.keys(useGame.getState().stars).length > 0,
  )
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
        <HUD />
        <ModuleHost />
      </>
    )

  return (
    <div className="app-stage">
      <div className="app-column">
        <Backdrop />
        <div className="relative">{screen}</div>
      </div>
    </div>
  )
}
