import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang } from '../lib/i18n'

export type VisitPath = 'checkup' | 'treatment'

interface GameState {
  lang: Lang | null
  path: VisitPath | null
  childName: string
  stars: Record<string, true>
  heroEarned: boolean
  freePlay: boolean
  setLang: (l: Lang) => void
  setPath: (p: VisitPath) => void
  setChildName: (n: string) => void
  awardStar: (moduleId: string) => void
  startFreePlay: () => void
  reset: () => void
}

const initial = {
  lang: null,
  path: null,
  childName: '',
  stars: {} as Record<string, true>,
  heroEarned: false,
  freePlay: false,
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      ...initial,
      setLang: lang => set({ lang }),
      setPath: path => set({ path }),
      setChildName: childName => set({ childName }),
      awardStar: id => {
        const stars = { ...get().stars, [id]: true as const }
        set({ stars, heroEarned: get().heroEarned || Object.keys(stars).length >= 5 })
      },
      startFreePlay: () => set({ freePlay: true }),
      reset: () => set({ ...initial, stars: {} }),
    }),
    { name: 'dental-adventure-v1' },
  ),
)

export function initFromUrl(search: string) {
  const v = new URLSearchParams(search).get('visit')
  if (v === 'checkup' || v === 'treatment') useGame.getState().setPath(v)
}

export const selectStarCount = (s: { stars: Record<string, true> }) => Object.keys(s.stars).length
