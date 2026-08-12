import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { STRING_IDS } from '../src/lib/i18n'

// Narration is the primary channel for non-reading users:
// a missing clip in either language is a release blocker.
//
// PENDING_CLIPS: lines waiting on a working ELEVENLABS_API_KEY in F:/Dental_kids/.env —
// run `node scripts/generate-audio.mjs`, then empty this list. Adding a string
// without either a clip or a conscious entry here still fails the suite.
const PENDING_CLIPS = new Set([
  // reworded 2026-08-12 (stale clips deleted): P0.5 truthful-copy pass
  'spray.title',
  'spray.intro',
  'tool.spray.name',
  'prepare.step.spray',
  'cert.for',
  'milo.welcome',
  // new 2026-08-12: Milo's story arc (P0.4)
  'story.calmer1',
  'story.calmer2',
  'story.calmer3',
  'story.reversal',
  'story.together',
])

for (const lang of ['en', 'ar'] as const) {
  test(`every string id has a ${lang} narration clip (or is consciously pending)`, () => {
    const missing = STRING_IDS.filter(id => !existsSync(resolve(__dirname, `../public/audio/${lang}/${id}.mp3`)))
    expect(missing.filter(id => !PENDING_CLIPS.has(id))).toEqual([])
  })
}
