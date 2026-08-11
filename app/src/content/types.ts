export type ModuleKind = 'clinic' | 'tools' | 'practice-brush' | 'prepare' | 'spray' | 'visit'

export interface ModuleDef {
  id: string
  kind: ModuleKind
  stars: number
  titleId: string
  toolIds?: string[]
}

export interface PathManifest {
  path: 'checkup' | 'treatment'
  modules: ModuleDef[]
}
