// Speaks the helper lines in scripts/voice-lines.json with one ElevenLabs voice.
//
// The board's thirteen helpers each introduce themselves in the first person —
// "I'm the mirror! I help the dentist see your teeth from every side." That is a
// different script from the narration in app/src/content/strings/*.json, which
// describes the tools from the outside, so these clips are written somewhere of
// their own rather than over the top of the shipped narration. Audition them,
// then decide what to do with them; see the note at the bottom of this file.
//
// The key comes from .env at the repo root (ELEVENLABS_API_KEY=...), or from the
// environment, and is never written into the repo.
//
// Usage: node scripts/generate-voice-lines.mjs [options]
//   --lang=ar|en   just that language (default: both)
//   --only=<id>    just one line, e.g. --only=tool.mirror
//   --sample       first line of each language only, for a quick listen
//   --voice=<id>   override the voice in voice-lines.json
//   --model=<id>   default eleven_multilingual_v2
//   --force        re-speak clips that already exist (default: skip them)
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const arg = name => process.argv.find(a => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=')
const flag = name => process.argv.includes(`--${name}`)

const KEY =
  process.env.ELEVENLABS_API_KEY ??
  (existsSync(resolve(root, '.env')) ? readFileSync(resolve(root, '.env'), 'utf8').match(/ELEVENLABS_API_KEY=(\S+)/)?.[1] : null)
if (!KEY) {
  console.error('No ELEVENLABS_API_KEY — put it in .env at the repo root or in the environment.')
  process.exit(1)
}

const script = JSON.parse(readFileSync(resolve(root, 'scripts/voice-lines.json'), 'utf8'))
const VOICE = arg('voice') ?? script.voice
const MODEL = arg('model') ?? 'eleven_multilingual_v2'
const OUT = resolve(root, 'voice-lines')

/**
 * Settings per language, matching the direction in docs/arabic-audio-script.md:
 * a friendly older brother, calm and playful, never over-excited. Arabic sits a
 * little steadier because Egyptian colloquial run through a loose stability
 * wanders in pitch across a short line.
 */
const SETTINGS = {
  en: { stability: 0.45, similarity_boost: 0.75, style: 0.35 },
  ar: { stability: 0.55, similarity_boost: 0.8, style: 0.2 },
}

/**
 * Emoji are punctuation for the eye, not for the ear. Left in, a model either
 * names them out loud or stumbles over the pause; the line has to end on its
 * last real word.
 */
const speakable = text =>
  text
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}️‍]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()

async function tts(text, lang) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_96`
  const body = JSON.stringify({ text, model_id: MODEL, language_code: lang, voice_settings: SETTINGS[lang] })
  // Rate limits and the odd 5xx are normal on a long run; back off rather than
  // losing the whole batch to one bad second.
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
      body,
    })
    if (res.ok) return Buffer.from(await res.arrayBuffer())
    const detail = await res.text()
    if (attempt >= 4 || ![429, 500, 502, 503, 504].includes(res.status)) {
      throw new Error(`${res.status} ${detail}`)
    }
    const wait = 2000 * attempt
    console.warn(`  ${res.status}, retrying in ${wait / 1000}s`)
    await new Promise(r => setTimeout(r, wait))
  }
}

const ONLY = arg('only')
const LANGS = arg('lang') ? [arg('lang')] : ['ar', 'en']
const lines = ONLY ? script.lines.filter(l => l.id === ONLY) : script.lines
if (!lines.length) {
  console.error(`No line with id "${ONLY}". Ids: ${script.lines.map(l => l.id).join(', ')}`)
  process.exit(1)
}

console.log(`voice ${VOICE}  model ${MODEL}`)
let spoken = 0
let skipped = 0
let failed = false
// Labelled so a dead line stops the whole run rather than marching on through
// twenty-five more requests that will fail the same way.
speaking: for (const lang of LANGS) {
  mkdirSync(resolve(OUT, lang), { recursive: true })
  const todo = flag('sample') ? lines.slice(0, 1) : lines
  for (const line of todo) {
    const file = resolve(OUT, lang, `${line.id}.mp3`)
    if (existsSync(file) && !flag('force')) {
      skipped++
      continue
    }
    const text = speakable(line[lang])
    process.stdout.write(`${lang}  ${line.id.padEnd(16)} ${text.slice(0, 48)}… `)
    // A failure here is almost always something the operator can fix in one
    // move — a wrong voice id, a key without text-to-speech on it, an empty
    // quota — so say which line died and what the API said, and stop. A stack
    // trace through fetch tells them nothing they can act on.
    let mp3
    try {
      mp3 = await tts(text, lang)
    } catch (err) {
      console.log('failed')
      console.error(`
✗ ${lang} ${line.id}: ${err.message}`)
      // exitCode rather than exit(): on Windows, exit() while a fetch socket is
      // still closing trips a libuv assertion and the shell sees 127, not 1.
      process.exitCode = 1
      failed = true
      break speaking
    }
    writeFileSync(file, mp3)
    spoken++
    console.log(`${(mp3.length / 1024).toFixed(0)} KB`)
  }
}

if (!failed) {
  console.log(`\n${spoken} spoken, ${skipped} already there → voice-lines/`)
  if (skipped) console.log('(--force to re-speak them, e.g. after a voice change)')
}

// Folding these into the game later: the clips are named by the string id they
// belong to, so copying voice-lines/<lang>/<id>.mp3 over
// app/public/audio/<lang>/<id>.desc.mp3 is the whole install. Do NOT do it
// without also rewriting <id>.desc in app/src/content/strings/<lang>.json to
// this same first-person wording — a child hears the clip while reading the
// caption, and the two saying different things is worse than either alone.
