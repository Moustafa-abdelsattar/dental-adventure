// Transcribes every Arabic clip that actually has audio, so the English
// narration can be written against what the Arabic recordings really say
// rather than against an older English draft that drifted from them.
//
// Output: artifacts/arabic-transcripts.json — { id: { text, seconds, words } }
//
// Usage: node scripts/transcribe-arabic.mjs [--only=id,id]
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const KEY = readFileSync(resolve(root, '.env'), 'utf8').match(/ELEVENLABS_API_KEY=(\S+)/)[1]
const dir = resolve(root, 'app/public/audio/ar')
const outPath = resolve(root, 'artifacts/arabic-transcripts.json')
mkdirSync(resolve(root, 'artifacts'), { recursive: true })

const only = process.argv.find(a => a.startsWith('--only='))?.slice(7)?.split(',')
const cache = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : {}

const ids = readdirSync(dir)
  .filter(f => f.endsWith('.mp3'))
  .map(f => f.replace(/\.mp3$/, ''))
  .filter(id => statSync(resolve(dir, `${id}.mp3`)).size >= 6000) // skip the silent placeholders
  .filter(id => (only ? only.includes(id) : true))
  .filter(id => (only ? true : !cache[id]))

console.log(`${ids.length} clips to transcribe`)

for (const id of ids) {
  const src = resolve(dir, `${id}.mp3`)
  const tmp = resolve(root, 'artifacts', '_stt.mp3')
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-ac', '1', '-ar', '16000', tmp])

  const form = new FormData()
  form.append('file', new Blob([readFileSync(tmp)]), 'clip.mp3')
  form.append('model_id', 'scribe_v1')
  form.append('language_code', 'ara')

  const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': KEY },
    body: form,
  })
  if (!res.ok) {
    console.log(`  ! ${id}: ${res.status} ${(await res.text()).slice(0, 120)}`)
    continue
  }
  const json = await res.json()
  const seconds = Number(
    execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src], {
      encoding: 'utf8',
    }).trim(),
  )
  cache[id] = {
    text: json.text,
    seconds: Math.round(seconds * 1000) / 1000,
    words: (json.words ?? []).filter(w => w.type === 'word').map(w => ({ t: w.start, w: w.text })),
  }
  writeFileSync(outPath, JSON.stringify(cache, null, 1))
  console.log(`  ok ${id} (${seconds.toFixed(1)}s)`)
}

console.log(`\nwrote ${outPath} — ${Object.keys(cache).length} transcripts`)
