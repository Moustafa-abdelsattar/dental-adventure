// Imports the owner-generated ChatGPT art: trims transparent margins,
// downscales to max 640px, and installs under public/art with final names.
import sharp from 'sharp'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC = 'F:/Dental_kids/images'
const DST = resolve(import.meta.dirname, '../public/art')

const MAP = [
  ['01_13_01', 'clinic-chair'],
  ['01_14_33', 'clinic-light'],
  ['01_19_05', 'clinic-sink'],
  ['(1)', 'tool-mirror'],
  ['(2)', 'tool-explorer'],
  ['(3)', 'tool-suction'],
  ['(4)', 'tool-syringe'],
  ['(5)', 'tool-brush'],
  ['(6)', 'tool-xray'],
  ['(7)', 'tool-ring'],
  ['(8)', 'tool-umbrella'],
  ['(9)', 'tool-spray'],
  ['01_33_47', 'clinic-table'],
  ['01_38_42', 'drnour'],
  ['01_40_46', 'visit-child-chair'],
  ['01_42_30', 'milo'],
  ['01_44_21', 'milo-celebrate'],
  ['01_47_42', 'tooth-happy'],
  ['01_49_18', 'tooth-sleepy'],
]

const files = readdirSync(SRC)
for (const [key, name] of MAP) {
  const file = files.find(f => f.includes(key))
  if (!file) {
    console.error('MISSING:', key)
    continue
  }
  const out = resolve(DST, `${name}.webp`)
  const img = sharp(resolve(SRC, file)).trim({ threshold: 8 }).resize(640, 640, { fit: 'inside', withoutEnlargement: true })
  await img.webp({ quality: 84, alphaQuality: 90 }).toFile(out)
  console.log('✓', name)
}
