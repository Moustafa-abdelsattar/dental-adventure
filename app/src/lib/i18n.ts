import en from '../content/strings/en.json'
import ar from '../content/strings/ar.json'

export type Lang = 'en' | 'ar'
export type StringId = keyof typeof en

const tables: Record<Lang, Record<string, string>> = { en, ar }

export const STRING_IDS = Object.keys(en) as StringId[]

/**
 * No-name fallback: `friend.vocative` is a |-separated pool of fun nicknames.
 * The pick is a deterministic hash of the string id so the same line always
 * uses the same nickname — pre-generated audio clips stay in sync with text.
 */
export function vocativeFor(lang: Lang, id: string): string {
  const pool = (tables[lang]['friend.vocative'] ?? '').split('|')
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % 997
  return (pool[h % pool.length] ?? pool[0]).trim()
}

export function t(lang: Lang, id: StringId, vars: { name?: string } = {}): string {
  const table = tables[lang]
  const name = vars.name?.trim() || vocativeFor(lang, id)
  const out = (table[id] ?? id).replaceAll('{name}', name)
  // a lowercase nickname can land at the start of a line ("champ's Adventure")
  return lang === 'en' ? out.charAt(0).toUpperCase() + out.slice(1) : out
}

export const dirFor = (lang: Lang): 'ltr' | 'rtl' => (lang === 'ar' ? 'rtl' : 'ltr')
