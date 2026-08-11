import type { ComponentType } from 'react'
import type { ModuleDef, ModuleKind } from '../content/types'
import { ClinicScreen } from './ClinicScreen'
import { ToolsScreen } from './ToolsScreen'
import { PracticeBrushScreen } from './PracticeBrushScreen'
import { PrepareScreen } from './PrepareScreen'
import { SprayScreen } from './SprayScreen'
import { VisitScreen } from './VisitScreen'

export interface ModuleProps {
  module: ModuleDef
  /** Call when the module is finished; origin = viewport point the star should fly from. */
  onComplete: (origin?: { x: number; y: number }) => void
}

export type ModuleRegistry = Partial<Record<ModuleKind, ComponentType<ModuleProps>>>

export const defaultRegistry: ModuleRegistry = {
  clinic: ClinicScreen,
  tools: ToolsScreen,
  'practice-brush': PracticeBrushScreen,
  prepare: PrepareScreen,
  spray: SprayScreen,
  visit: VisitScreen,
}
