import en from '../content/strings/en.json'
import ar from '../content/strings/ar.json'

export type Lang = 'en' | 'ar'
export type StringId = keyof typeof en

const tables: Record<Lang, Record<string, string>> = { en, ar }

export const STRING_IDS = Object.keys(en) as StringId[]

export function t(lang: Lang, id: StringId, vars: { name?: string } = {}): string {
  const table = tables[lang]
  const name = vars.name?.trim() || table['friend.vocative']
  return (table[id] ?? id).replaceAll('{name}', name)
}

export const dirFor = (lang: Lang): 'ltr' | 'rtl' => (lang === 'ar' ? 'rtl' : 'ltr')
