import en from '../src/content/strings/en.json'
import ar from '../src/content/strings/ar.json'
import { t, dirFor, STRING_IDS, vocativeFor } from '../src/lib/i18n'

test('en and ar have identical key sets', () => {
  expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort())
})

test('STRING_IDS covers every key', () => {
  expect(STRING_IDS.sort()).toEqual(Object.keys(en).sort())
})

test('templating inserts name', () => {
  expect(t('en', 'milo.great', { name: 'Omar' })).toBe('Great job, Omar!')
  expect(t('ar', 'milo.great', { name: 'عمر' })).toContain('عمر')
})

test('empty name falls back to a fun nickname from the pool, deterministically per line', () => {
  const pools = { en: en['friend.vocative'].split('|'), ar: ar['friend.vocative'].split('|') }
  for (const lang of ['en', 'ar'] as const) {
    const nick = vocativeFor(lang, 'milo.great')
    expect(pools[lang]).toContain(nick)
    expect(vocativeFor(lang, 'milo.great')).toBe(nick) // stable across calls
    expect(t(lang, 'milo.great', {})).toContain(nick)
  }
  // the whole point: different lines rotate through different nicknames
  const nameLines = STRING_IDS.filter(id => en[id].includes('{name}'))
  const used = new Set(nameLines.map(id => vocativeFor('en', id)))
  expect(used.size).toBeGreaterThan(2)
})

test('dir mapping', () => {
  expect(dirFor('en')).toBe('ltr')
  expect(dirFor('ar')).toBe('rtl')
})

test('no banned absolute promises in copy', () => {
  const all = JSON.stringify(en).toLowerCase()
  for (const banned of ['never hurts', 'no pain', "won't hurt", "doesn't hurt", 'painless'])
    expect(all).not.toContain(banned)
})
