import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './theme.css'
import App from './App.tsx'

// Reload the open page as soon as a newly deployed service worker takes over,
// so nobody keeps playing a stale cached build after an update ships.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
