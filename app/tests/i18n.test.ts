import en from '../src/content/strings/en.json'
import ar from '../src/content/strings/ar.json'
import { t, dirFor, STRING_IDS } from '../src/lib/i18n'

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

test('empty name falls back to localized friend word', () => {
  expect(t('en', 'milo.great', {})).toBe('Great job, my friend!')
  expect(t('ar', 'milo.great', {})).toContain('صديقي')
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
