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

const LANGS: Lang[] = ['en', 'ar']
const PATHS: VisitPath[] = ['checkup', 'treatment']
/** Same cap the name field enforces, applied again on the way back in. */
const NAME_MAX = 24

/**
 * Nothing that comes out of localStorage is trusted.
 *
 * It is a save on a device we do not control, written by a build that may not
 * be this one — a language we have since dropped, a visit type that was
 * renamed, a half-written record from a tab that was closed mid-write, or a
 * value someone typed into devtools. A `lang` of `"fr"` used to be enough to
 * white-screen the game on boot, and because the bad value is persisted,
 * reloading never recovered it: the child was stuck on a blank page for good.
 *
 * So the shape is rebuilt field by field rather than spread in, and anything
 * unrecognised falls back to the value a first-time player would have.
 */
export function sanitize(saved: unknown): Partial<GameState> {
  if (!saved || typeof saved !== 'object') return {}
  const s = saved as Record<string, unknown>

  const stars: Record<string, true> = {}
  if (s.stars && typeof s.stars === 'object' && !Array.isArray(s.stars)) {
    for (const [id, v] of Object.entries(s.stars as Record<string, unknown>)) {
      if (v === true && typeof id === 'string') stars[id] = true
    }
  }

  return {
    lang: LANGS.includes(s.lang as Lang) ? (s.lang as Lang) : null,
    path: PATHS.includes(s.path as VisitPath) ? (s.path as VisitPath) : null,
    childName: typeof s.childName === 'string' ? s.childName.slice(0, NAME_MAX) : '',
    stars,
    // earned by having the stars, not by the flag claiming so
    heroEarned: s.heroEarned === true && Object.keys(stars).length >= 5,
    freePlay: s.freePlay === true,
  }
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
    {
      name: 'dental-adventure-v1',
      merge: (persisted, current) => ({ ...current, ...sanitize(persisted) }),
    },
  ),
)

export function initFromUrl(search: string) {
  const v = new URLSearchParams(search).get('visit')
  if (v === 'checkup' || v === 'treatment') useGame.getState().setPath(v)
}

export const selectStarCount = (s: { stars: Record<string, true> }) => Object.keys(s.stars).length
