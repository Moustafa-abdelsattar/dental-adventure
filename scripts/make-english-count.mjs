// Builds app/public/audio/en/visit.countToTen.mp3 with real gaps between the
// numbers.
//
// This one clip cannot come straight out of the TTS. The Arabic is a person
// counting a four-year-old down, ~1.7s per number across 16.7s, with silence
// to count into. The synthesised English reads the same ten words in 4.2s, and
// punctuation only gets it to 8.8s — commas and full stops buy a breath, not a
// beat. So each number is synthesised on its own and spaced by hand.
//
// Rerun this after any narration regeneration: generate-audio.mjs will happily
// overwrite it with the same ten words read straight through.
//
// Usage: node scripts/make-english-count.mjs [--gap=900]
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const KEY = readFileSync(resolve(root, '.env'), 'utf8').match(/ELEVENLABS_API_KEY=(\S+)/)[1]

// The same voice and model as every other English clip. Building this one by
// hand is about the gaps, not the narrator — a different voice counting to ten
// in the middle of the visit would be worse than the rushed version.
const VOICE = 'vWDp3PLsTWjIhBxxUKh9'
const MODEL = 'eleven_multilingual_v2'
const SETTINGS = { stability: 0.45, similarity_boost: 0.75, style: 0.35 }
const GAP_MS = Number(process.argv.find(a => a.startsWith('--gap='))?.slice(6) ?? 900)
const NUMBERS = ['One.', 'Two.', 'Three.', 'Four.', 'Five.', 'Six.', 'Seven.', 'Eight.', 'Nine.', 'Ten.']

const tmp = resolve(root, 'artifacts', '_count')
rmSync(tmp, { recursive: true, force: true })
mkdirSync(tmp, { recursive: true })

const parts = []
for (const [i, word] of NUMBERS.entries()) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_96`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: word, model_id: MODEL, voice_settings: SETTINGS }),
  })
  if (!res.ok) throw new Error(`${word}: ${res.status} ${await res.text()}`)
  const p = resolve(tmp, `${i}.mp3`)
  writeFileSync(p, Buffer.from(await res.arrayBuffer()))
  parts.push(p)
  process.stdout.write(`${word} `)
}
console.log()

// one silence, reused between every number
const gap = resolve(tmp, 'gap.mp3')
execFileSync('ffmpeg', [
  '-v', 'error', '-y',
  '-f', 'lavfi', '-i', `anullsrc=r=44100:cl=mono`,
  '-t', String(GAP_MS / 1000),
  '-c:a', 'libmp3lame', '-b:a', '96k',
  gap,
])

const listPath = resolve(tmp, 'list.txt')
const seq = parts.flatMap((p, i) => (i === parts.length - 1 ? [p] : [p, gap]))
writeFileSync(listPath, seq.map(p => `file '${p.split('\\').join('/')}'`).join('\n'))

const out = resolve(root, 'app/public/audio/en/visit.countToTen.mp3')
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c:a', 'libmp3lame', '-b:a', '96k', out])
rmSync(tmp, { recursive: true, force: true })

const secs = Number(
  execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out], {
    encoding: 'utf8',
  }).trim(),
)
console.log(`wrote ${out}`)
console.log(`  ${secs.toFixed(2)}s with a ${GAP_MS}ms gap between numbers`)
console.log(`  set COUNT_TEN_MS.en in app/src/screens/VisitScreen.tsx to ${Math.round(secs * 1000)}`)
if (!existsSync(out)) process.exit(1)
