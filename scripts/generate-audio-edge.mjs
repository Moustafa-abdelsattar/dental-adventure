// Regenerates every narration clip in both languages via Microsoft Edge
// neural TTS (free, no API key). Fallback pipeline while the ElevenLabs key
// is unavailable — rerun scripts/generate-audio.mjs (after wiping the audio
// dirs) to restore the premium voice once a valid key is in .env.
//
// Usage: node scripts/generate-audio-edge.mjs [--wipe]
//   --wipe  delete existing clips first so everything regenerates
import { readFileSync, mkdirSync, writeFileSync, existsSync, readdirSync, rmSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { MsEdgeTTS, OUTPUT_FORMAT } = require('../app/node_modules/msedge-tts/dist/index.js')

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const WIPE = process.argv.includes('--wipe')

// Ana is a child voice — a natural fit for Milo. Arabic has no child neural
// voice, so Salma (warm, friendly Egyptian) narrates the Arabic side.
const VOICES = { en: 'en-US-AnaNeural', ar: 'ar-EG-SalmaNeural' }

async function makeTts(lang) {
  const tts = new MsEdgeTTS()
  await tts.setMetadata(VOICES[lang], OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3)
  return tts
}

async function synth(tts, text) {
  const { audioStream } = await tts.toStream(text)
  const chunks = []
  for await (const c of audioStream) chunks.push(c)
  return Buffer.concat(chunks)
}

let generated = 0
let skipped = 0
for (const lang of ['en', 'ar']) {
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

  let tts = await makeTts(lang)
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
        const buf = await synth(tts, text)
        if (buf.length < 1000) throw new Error(`suspiciously small clip (${buf.length}B)`)
        writeFileSync(out, buf)
        generated++
        console.log(`ok ${lang}/${id} (${(buf.length / 1024).toFixed(0)} KB)`)
        break
      } catch (e) {
        attempts++
        if (attempts >= 4) throw e
        console.log(`retry ${attempts} for ${lang}/${id}: ${e.message}`)
        tts = await makeTts(lang) // fresh connection after a failure
        await new Promise(r => setTimeout(r, 1500 * attempts))
      }
    }
  }
}
console.log(`done: ${generated} generated, ${skipped} skipped`)
