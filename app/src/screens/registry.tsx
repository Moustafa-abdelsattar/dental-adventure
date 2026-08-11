import type { ComponentType } from 'react'
import type { ModuleDef, ModuleKind } from '../content/types'

export interface ModuleProps {
  module: ModuleDef
  /** Call when the module is finished; origin = viewport point the star should fly from. */
  onComplete: (origin?: { x: number; y: number }) => void
}

export type ModuleRegistry = Partial<Record<ModuleKind, ComponentType<ModuleProps>>>

/**
 * Placeholder module used until the real screen for a kind is built.
 * Replaced entry-by-entry in Tasks 9-12.
 */
function DevModule({ module, onComplete }: ModuleProps) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4">
      <p className="text-xl font-bold">[dev] {module.id}</p>
      <button className="min-h-[72px] px-8 rounded-full bg-mint text-white text-xl font-bold" onClick={() => onComplete()}>
        complete {module.id}
      </button>
    </div>
  )
}

export const defaultRegistry: ModuleRegistry = {
  clinic: DevModule,
  tools: DevModule,
  'practice-brush': DevModule,
  prepare: DevModule,
  spray: DevModule,
  visit: DevModule,
}
