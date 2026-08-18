// Imports layered clinic art, preserving geometry.
//
// `import-art.mjs` trims every image to its own content box. That is right for
// a standalone prop — it removes dead transparent margin so the art fills its
// slot — and it is fatal for a layer set. Trim a chair's base and its headrest
// independently and each lands at a different offset, so the headrest no longer
// sits on the backrest. The failure looks like an art mistake, which is the
// worst kind of pipeline bug.
//
// So this script never trims, and it scales every layer in a set by one shared
// factor. Parts go in aligned and come out aligned.
//
// Usage: node scripts/import-layers.mjs [--dry]
//
//   art-in/source-art/clinic/
//   ├── room-empty.png          a single image  → clinic-room-empty.webp
//   └── chair/                  a layer set     → clinic-chair-base.webp
//       ├── base.png                              clinic-chair-headrest.webp
//       └── headrest.png
//
// Every file inside a layer-set folder must share one canvas size. That is the
// contract, and it is checked rather than assumed — a mismatch fails loudly
// here instead of quietly misplacing a limb three screens later.

import sharp from 'sharp'
import { readdirSync, statSync, mkdirSync } from 'node:fs'
import { resolve, join, parse } from 'node:path'

const SRC = resolve(import.meta.dirname, '../../art-in/source-art/clinic')
const DST = resolve(import.meta.dirname, '../public/art')
const DRY = process.argv.includes('--dry')

/** Long edge in the shipped file. Backgrounds go full-bleed, props do not. */
const MAX_EDGE = { 'room-empty': 1280, _default: 640 }
const maxFor = name => MAX_EDGE[name] ?? MAX_EDGE._default

const WEBP = { quality: 84, alphaQuality: 90 }

let wrote = 0
let failed = 0

const write = async (pipeline, outName) => {
  const out = resolve(DST, `${outName}.webp`)
  if (DRY) {
    console.log('  would write', `${outName}.webp`)
    return
  }
  await pipeline.webp(WEBP).toFile(out)
  console.log('  ✓', `${outName}.webp`)
  wrote++
}

let entries
try {
  entries = readdirSync(SRC)
} catch {
  console.error(`No drop found at ${SRC}`)
  console.error('Create it and add the art, then re-run. See art-in/README.md.')
  process.exit(1)
}

mkdirSync(DST, { recursive: true })

for (const entry of entries.sort()) {
  const full = join(SRC, entry)

  // ---- a layer set -------------------------------------------------------
  if (statSync(full).isDirectory()) {
    const layers = readdirSync(full).filter(f => /\.png$/i.test(f)).sort()
    if (!layers.length) {
      console.warn(`! ${entry}/ has no PNGs — skipped`)
      continue
    }

    console.log(`${entry}/  (layer set, ${layers.length} layers)`)

    const metas = await Promise.all(
      layers.map(async f => ({ file: f, meta: await sharp(join(full, f)).metadata() })),
    )

    // The contract: one canvas for the whole set.
    const [{ meta: first }] = metas
    const odd = metas.filter(m => m.meta.width !== first.width || m.meta.height !== first.height)
    if (odd.length) {
      console.error(`  ✗ layers do not share a canvas. Expected ${first.width}x${first.height}:`)
      for (const m of metas) console.error(`      ${m.meta.width}x${m.meta.height}  ${m.file}`)
      console.error('    Re-export the set on one canvas, in place, without cropping.')
      failed++
      continue
    }

    const noAlpha = metas.filter(m => !m.meta.hasAlpha)
    if (noAlpha.length) {
      console.warn(`  ! no alpha channel: ${noAlpha.map(m => m.file).join(', ')}`)
    }

    // One factor for the whole set, derived from the shared canvas — so the
    // layers stay registered at the shipped size too.
    const max = maxFor(entry)
    const scale = Math.min(1, max / Math.max(first.width, first.height))
    const width = Math.round(first.width * scale)
    const height = Math.round(first.height * scale)

    for (const { file } of metas) {
      const layer = parse(file).name
      await write(sharp(join(full, file)).resize(width, height, { fit: 'fill' }), `clinic-${entry}-${layer}`)
    }
    continue
  }

  // ---- a single image ----------------------------------------------------
  if (!/\.png$/i.test(entry)) continue
  const name = parse(entry).name
  console.log(`${entry}  (single)`)
  await write(
    sharp(full).resize(maxFor(name), maxFor(name), { fit: 'inside', withoutEnlargement: true }),
    `clinic-${name}`,
  )
}

console.log(DRY ? '\nDry run — nothing written.' : `\n${wrote} file(s) written to public/art.`)
if (failed) {
  console.error(`${failed} set(s) rejected.`)
  process.exit(1)
}
