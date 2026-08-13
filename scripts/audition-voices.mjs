// Renders the same English narration line through several ElevenLabs voices
// so the owner can listen and pick Milo's premium English voice.
import { writeFileSync, mkdirSync } from 'node:fs'
import { readFileSync } from 'node:fs'

const KEY = readFileSync('F:/Dental_kids/.env', 'utf8').match(/ELEVENLABS_API_KEY=(\S+)/)[1]
const OUT = 'F:/Dental_kids/voice-auditions'
mkdirSync(OUT, { recursive: true })

const TEXT = "Hello! Let's play in English! These are the dentist's little helpers, buddy. Tap each one to say hello!"

const CANDIDATES = [
  ['00-current-milo', 'UR972wNGq3zluze0LoIp'],
  ['01-liam', 'TX3LXPfrHuNFbAXjTBEQ'],
  ['02-will', 'bIHbv24MWmeRgasZH58o'],
  ['03-charlie', 'IKne3meq5aSn9XLyUdCD'],
  ['04-brian', 'nPczCjzI2devNBz1zQrb'],
  ['05-laura', 'FGY2WhTYpPnrIDTdsKH5'],
  ['06-jessica', 'cgSgspJ2msm6clMCkdW9'],
  ['07-matilda', 'XrExE9yKIg1WjnnlVkGX'],
  ['08-sarah', 'EXAVITQu4vr4xnSDxMaL'],
  ['09-alice', 'Xb7hH8MSUJpSbSDYk0k2'],
]

for (const [name, id] of CANDIDATES) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${id}?output_format=mp3_44100_96`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: TEXT,
      model_id: 'eleven_turbo_v2_5',
      language_code: 'en',
      voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.35 },
    }),
  })
  if (!res.ok) {
    console.log(`FAIL ${name}: ${res.status} ${(await res.text()).slice(0, 120)}`)
    continue
  }
  const buf = Buffer.from(await res.arrayBuffer())
  writeFileSync(`${OUT}/${name}.mp3`, buf)
  console.log(`ok ${name} (${(buf.length / 1024).toFixed(0)} KB)`)
}
