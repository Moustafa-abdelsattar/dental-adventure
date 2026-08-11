import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { STRING_IDS } from '../src/lib/i18n'

// Narration is the primary channel for non-reading users:
// a missing clip in either language is a release blocker.
for (const lang of ['en', 'ar'] as const) {
  test(`every string id has a ${lang} narration clip`, () => {
    const missing = STRING_IDS.filter(id => !existsSync(resolve(__dirname, `../public/audio/${lang}/${id}.mp3`)))
    expect(missing).toEqual([])
  })
}
