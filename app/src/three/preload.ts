/**
 * Progressive scene loading, per the approach doc §22.
 *
 * The game never downloads everything up front. Each scene warms the next one
 * while the child is still busy with the current one:
 *
 *   WELCOME → preload clinic → CLINIC → preload tools → TOOLS → preload tooth
 *
 * By the time they tap through, the next act is already in memory, so the
 * handover has nothing to wait for.
 */
export type SceneId = 'clinic' | 'tools' | 'tooth'

/** The order the game walks. `undefined` means nothing follows. */
const NEXT: Record<SceneId, SceneId | undefined> = {
  clinic: 'tools',
  tools: 'tooth',
  tooth: undefined,
}

type Loader = () => Promise<unknown>

const loaders = new Map<SceneId, Loader>()
const started = new Map<SceneId, Promise<unknown>>()

/**
 * Tell the preloader how to fetch a scene. Each scene registers itself, so
 * this file never has to import them and drag them into the main bundle.
 */
export function registerScene(id: SceneId, loader: Loader) {
  loaders.set(id, loader)
}

/** Fetch a scene now, at most once. Safe to call repeatedly. */
export function preloadScene(id: SceneId): Promise<unknown> {
  const already = started.get(id)
  if (already) return already
  const loader = loaders.get(id)
  // An unregistered scene is not an error — it just has nothing to warm yet.
  const run = loader ? loader() : Promise.resolve()
  started.set(id, run)
  return run
}

/** Arriving at a scene warms whatever comes after it. */
export function warmNextScene(current: SceneId): Promise<unknown> {
  const next = NEXT[current]
  return next ? preloadScene(next) : Promise.resolve()
}

/** Test seam: forget what has been registered and fetched. */
export function resetPreloader() {
  loaders.clear()
  started.clear()
}
