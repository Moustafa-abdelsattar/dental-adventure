// Builds app/public/audio/en/visit.countToTen.mp3 with real gaps between the
// numbers.
//
// This one clip cannot come straight out of the TTS. The Arabic is a person
// counting a four-year-old down, ~1.7s per number across 16.7s, with silence
// to count into. The synthesised English reads the same ten words in 4.2s, and
// punctuation only gets it to 8.8s — commas and full stops buy a breath, not a
// beat. So each number is synthesised on its own and spaced by hand.
//
// Rerun this after any narration regeneration: generate-audio-edge.mjs will
// happily overwrite it with the fast version.
//
// Usage: node scripts/make-english-count.mjs [--gap=900]
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const { MsEdgeTTS, OUTPUT_FORMAT } = require('../app/node_modules/msedge-tts/dist/index.js')

const VOICE = 'en-US-AndrewMultilingualNeural'
const PROSODY = { pitch: '+20%', rate: '-8%' }
const GAP_MS = Number(process.argv.find(a => a.startsWith('--gap='))?.slice(6) ?? 900)
const NUMBERS = ['One.', 'Two.', 'Three.', 'Four.', 'Five.', 'Six.', 'Seven.', 'Eight.', 'Nine.', 'Ten.']

const tmp = resolve(root, 'artifacts', '_count')
rmSync(tmp, { recursive: true, force: true })
mkdirSync(tmp, { recursive: true })

const tts = new MsEdgeTTS()
await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3)

const parts = []
for (const [i, word] of NUMBERS.entries()) {
  const { audioStream } = await tts.toStream(word, PROSODY)
  const chunks = []
  for await (const c of audioStream) chunks.push(c)
  const p = resolve(tmp, `${i}.mp3`)
  writeFileSync(p, Buffer.concat(chunks))
  parts.push(p)
  process.stdout.write(`${word} `)
}
console.log()

// one silence, reused between every number
const gap = resolve(tmp, 'gap.mp3')
execFileSync('ffmpeg', [
  '-v', 'error', '-y',
  '-f', 'lavfi', '-i', `anullsrc=r=24000:cl=mono`,
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
