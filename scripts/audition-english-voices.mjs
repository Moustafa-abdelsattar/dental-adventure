// Renders one line through every English voice this project has used, so the
// owner can pick by ear instead of by voice id.
//
// The ids come out of git history — the project has been through six of them,
// and the one that shipped longest for English was "Will".
//
// Output: artifacts/voice-candidates/<id>.mp3
// Usage: node scripts/audition-english-voices.mjs [--line="..."]
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const KEY = readFileSync(resolve(root, '.env'), 'utf8').match(/ELEVENLABS_API_KEY=(\S+)/)[1]
const out = resolve(root, 'artifacts/voice-candidates')
rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })

const LINE =
  process.argv.find(a => a.startsWith('--line='))?.slice(7) ??
  readFileSync(resolve(root, 'app/src/content/strings/en.json'), 'utf8').match(
    /"clinic\.suction\.desc":\s*"((?:[^"\\]|\\.)*)"/,
  )?.[1] ??
  'I am Mister Thirsty. I sip the water out of your mouth.'

const VOICES = [
  ['bIHbv24MWmeRgasZH58o', 'Will — young American male. The dedicated English voice, ddef008'],
  ['vWDp3PLsTWjIhBxxUKh9', 'Owner pick — one voice for both languages, 629a667'],
  ['cgSgspJ2msm6clMCkdW9', 'Jessica — the first bilingual narration, bf240b5'],
  ['wxweiHvoC2r2jFM7mS8b', 'Owner regeneration, 311998c'],
  ['TX3LPaxmHKxFdv7VOQHJ', 'Used for the Egyptian Arabic pass, 3e5ebf8'],
  ['UR972wNGq3zluze0LoIp', 'Dr Nour — hijabi female dentist (Arabic), 0a87e89'],
  ['tnSpp4vdxKPjI9w0GnoV', 'The one tried on 2026-09-06 and reverted'],
]

console.log(`line: ${LINE}\n`)
for (const [id, label] of VOICES) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${id}?output_format=mp3_44100_96`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: LINE, model_id: 'eleven_turbo_v2_5' }),
  })
  if (!res.ok) {
    console.log(`  ${res.status.toString().padEnd(4)} ${id}  ${label}`)
    continue
  }
  const file = resolve(out, `${id}.mp3`)
  writeFileSync(file, Buffer.from(await res.arrayBuffer()))
  const secs = Number(
    execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], {
      encoding: 'utf8',
    }).trim(),
  )
  console.log(`  ok   ${id}  ${secs.toFixed(1).padStart(5)}s  ${label}`)
}
console.log(`\nsamples in ${out}`)
console.log('the Arabic recording of this same line runs 8.5s')
