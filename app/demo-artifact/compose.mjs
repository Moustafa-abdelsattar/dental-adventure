// Folds the bundled viewer and the GLB into one self-contained page.
// The artifact host blocks every external request, so nothing may be fetched:
// the model rides along as a data URI and the script is inlined.
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const here = import.meta.dirname
const out = process.argv[2] ?? resolve(here, 'chair.html')

const [template, viewer, glb] = await Promise.all([
  readFile(resolve(here, 'template.html'), 'utf8'),
  readFile(resolve(here, 'dist/viewer.js'), 'utf8'),
  readFile(resolve(here, '../public/models/chair.glb')),
])

const dataUri = `data:model/gltf-binary;base64,${glb.toString('base64')}`

const html = template.replace('__MODEL_DATA_URI__', dataUri).replace('__VIEWER_JS__', () => viewer)

await writeFile(out, html)
console.log(`  viewer   ${(viewer.length / 1024).toFixed(0)} KB`)
console.log(`  model    ${(glb.length / 1024).toFixed(0)} KB → ${(dataUri.length / 1024).toFixed(0)} KB base64`)
console.log(`  page     ${(html.length / 1048576).toFixed(2)} MB → ${out}`)
