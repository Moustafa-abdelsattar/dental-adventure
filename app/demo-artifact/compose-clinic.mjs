// Folds the clinic viewer, the room plate, the chair and the narration into one
// self-contained page. The artifact host blocks every external request, so
// nothing may be fetched at runtime.
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const here = import.meta.dirname
const out = process.argv[2] ?? resolve(here, 'clinic.html')

const [template, viewer, glb, room, voice] = await Promise.all([
  readFile(resolve(here, 'clinic-template.html'), 'utf8'),
  readFile(resolve(here, 'dist-clinic/viewer.js'), 'utf8'),
  readFile(resolve(here, '../public/models/chair.glb')),
  readFile(resolve(here, '../public/art/clinic-room.webp')),
  readFile(resolve(here, '../public/audio/en/clinic.chair.desc.mp3')),
])

const uri = (buf, mime) => `data:${mime};base64,${buf.toString('base64')}`

const html = template
  .replace('__MODEL_DATA_URI__', uri(glb, 'model/gltf-binary'))
  .replace('__ROOM_DATA_URI__', uri(room, 'image/webp'))
  .replace('__NARRATION_DATA_URI__', uri(voice, 'audio/mpeg'))
  .replace('__VIEWER_JS__', () => viewer)

await writeFile(out, html)
const kb = b => (b.length / 1024).toFixed(0)
console.log(`  viewer     ${kb(viewer)} KB`)
console.log(`  chair      ${kb(glb)} KB`)
console.log(`  room       ${kb(room)} KB`)
console.log(`  narration  ${kb(voice)} KB`)
console.log(`  page       ${(html.length / 1048576).toFixed(2)} MB → ${out}`)
