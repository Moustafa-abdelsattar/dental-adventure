// Generates every narration clip in both languages via ElevenLabs TTS.
// Reads the API key from F:/Dental_kids/.env (ELEVENLABS_API_KEY=...).
// Skips clips that already exist, so it is safe to re-run / resume.
//
// Usage: node scripts/generate-audio.mjs [--lang=en|ar] [--wipe]
//   --lang  only that language (default: both)
//   --wipe  delete that language's clips first, so a voice change actually takes
import { readFileSync, mkdirSync, writeFileSync, existsSync, readdirSync, rmSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const env = readFileSync(resolve(root, '.env'), 'utf8')
const KEY = env.match(/ELEVENLABS_API_KEY=(\S+)/)[1]

// One voice per language. Arabic keeps the owner-picked voice-library voice
// (elevenlabs.io/app/voice-library?voiceId=…). English gets a native young male
// voice instead, because the Arabic-native voice carries an accent into English
// that reads as a different, less warm character to an English-speaking child.
// Both match the same direction: friendly older brother, calm playful energy,
// never overly excited (voice direction: docs/arabic-audio-script.md).
const VOICE_IDS = {
  ar: 'UR972wNGq3zluze0LoIp',
  en: 'bIHbv24MWmeRgasZH58o', // "Will" — young American male, warm, conversational
}
const MODEL = 'eleven_turbo_v2_5'

const SETTINGS = {
  en: { stability: 0.45, similarity_boost: 0.75, style: 0.35 },
  ar: { stability: 0.55, similarity_boost: 0.75, style: 0.2 },
}

async function tts(text, lang) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_IDS[lang]}?output_format=mp3_44100_96`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      language_code: lang,
      voice_settings: SETTINGS[lang],
    }),
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return Buffer.from(await res.arrayBuffer())
}

const WIPE = process.argv.includes('--wipe')
const ONLY = process.argv.find(a => a.startsWith('--lang='))?.slice(7)
const LANGS = ONLY ? [ONLY] : ['en', 'ar']

let generated = 0
let skipped = 0
for (const lang of LANGS) {
  const strings = JSON.parse(readFileSync(resolve(root, `app/src/content/strings/${lang}.json`), 'utf8'))
  // must mirror vocativeFor() in app/src/lib/i18n.ts so baked audio matches on-screen text
  const pool = strings['friend.vocative'].split('|')
  const vocativeFor = id => {
    let h = 0
    for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % 997
    return (pool[h % pool.length] ?? pool[0]).trim()
  }
  const dir = resolve(root, `app/public/audio/${lang}`)
  mkdirSync(dir, { recursive: true })
  if (WIPE) for (const f of readdirSync(dir)) rmSync(resolve(dir, f))
  for (const [id, template] of Object.entries(strings)) {
    const out = resolve(dir, `${id}.mp3`)
    if (existsSync(out)) {
      skipped++
      continue
    }
    const text = template.replaceAll('{name}', vocativeFor(id))
    let attempts = 0
    for (;;) {
      try {
        const buf = await tts(text, lang)
        writeFileSync(out, buf)
        generated++
        console.log(`✓ ${lang}/${id} (${(buf.length / 1024).toFixed(0)} KB)`)
        break
      } catch (e) {
        attempts++
        if (attempts >= 3) throw e
        console.warn(`retry ${attempts} for ${lang}/${id}: ${e.message.slice(0, 120)}`)
        await new Promise(r => setTimeout(r, 2000 * attempts))
      }
    }
    await new Promise(r => setTimeout(r, 150))
  }
}
console.log(`done: ${generated} generated, ${skipped} already existed`)
