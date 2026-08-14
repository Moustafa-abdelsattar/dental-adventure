import { lazy, Suspense, type ComponentProps } from 'react'
import type { Stage } from './Stage'

const Stage3D = lazy(() => import('./Stage').then(m => ({ default: m.Stage })))

/**
 * Mount the 3D stage without putting three.js in the first download.
 *
 * The language, parent and welcome screens have no 3D on them, and a child on
 * a slow connection should not wait for a renderer they are not looking at
 * yet. This keeps the initial bundle inside its 2.5 MB budget and lets §22's
 * progressive loading warm the renderer while the child is still choosing a
 * language.
 */
export function LazyStage(props: ComponentProps<typeof Stage>) {
  return (
    <Suspense fallback={null}>
      <Stage3D {...props} />
    </Suspense>
  )
}

/** Start fetching the renderer chunk before anything needs to draw with it. */
export function preloadStage() {
  return import('./Stage')
}
