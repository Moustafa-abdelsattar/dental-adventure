import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { STRING_IDS } from '../src/lib/i18n'

// Narration is the primary channel for non-reading users:
// a missing clip in either language is a release blocker.
//
// PENDING_CLIPS: lines consciously shipped without narration (e.g. waiting on
// a TTS provider). Adding a string without either a clip or an entry here
// fails the suite. Regenerate clips with scripts/generate-audio-edge.mjs
// (free, no key) or scripts/generate-audio.mjs (ElevenLabs, needs .env key).
const PENDING_CLIPS = new Set<string>([
  // Arabic-only continuous counting line. English still uses spray.count.1-10.
  'spray.countToTen',
])

for (const lang of ['en', 'ar'] as const) {
  test(`every string id has a ${lang} narration clip (or is consciously pending)`, () => {
    const missing = STRING_IDS.filter(id => !existsSync(resolve(__dirname, `../public/audio/${lang}/${id}.mp3`)))
    expect(missing.filter(id => !PENDING_CLIPS.has(id))).toEqual([])
  })
}
