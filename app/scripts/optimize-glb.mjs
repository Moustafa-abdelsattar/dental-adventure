// Turns a raw image-to-3D export into something a cheap Android phone can draw.
//
// Meshy hands back roughly 375k triangles and three 2048² textures per model —
// about 67 MB of VRAM for one object, against a budget of 48 MB for the whole
// game. This script is the whole cleanup pipeline in Node, so nobody needs
// Blender installed to ship an asset:
//
//   weld → simplify → drop unused channels → shrink textures → Draco
//
// Usage:
//   node scripts/optimize-glb.mjs <in.glb> <out.glb> [--tris 20000] [--tex 1024]
//
// Pivot origins are deliberately NOT set here. Meshy centres the origin on the
// bounding box, and rather than baking a new one per model we wrap the model in
// a pivot group at runtime (see three/Model.tsx), which is reversible and needs
// no DCC tool.
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, flatten, join, meshopt, prune, simplify, textureCompress, weld } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'

const [, , input, output, ...rest] = process.argv
if (!input || !output) {
  console.error('usage: node scripts/optimize-glb.mjs <in.glb> <out.glb> [--tris N] [--tex N]')
  process.exit(1)
}
const flag = (name, fallback) => {
  const i = rest.indexOf(`--${name}`)
  return i === -1 ? fallback : Number(rest[i + 1])
}
const targetTris = flag('tris', 20000)
const targetTex = flag('tex', 1024)

// meshopt rather than Draco on purpose: Draco's decoder is normally pulled from
// a Google CDN at runtime, and this game has to work offline. Meshopt's decoder
// ships in the bundle.
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder })

const doc = await io.read(input)
await MeshoptSimplifier.ready
await MeshoptEncoder.ready

const countTris = () =>
  doc
    .getRoot()
    .listMeshes()
    .flatMap(m => m.listPrimitives())
    .reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3, 0)

const before = { tris: countTris(), textures: doc.getRoot().listTextures().length }

// Meshy exports everything double-sided, which doubles the shading cost for
// faces the camera can never see. Nothing in this game is viewed from inside.
for (const material of doc.getRoot().listMaterials()) {
  material.setDoubleSided(false)
  // A stylised pastel object gains nothing from a metallic-roughness map or a
  // normal map at phone size, and each one costs as much VRAM as the colour.
  // Fold them into scalar factors instead.
  if (material.getMetallicRoughnessTexture()) {
    material.setMetallicRoughnessTexture(null)
    material.setMetallicFactor(0)
    material.setRoughnessFactor(0.7)
  }
  if (material.getNormalTexture()) material.setNormalTexture(null)
}

const ratio = Math.min(1, targetTris / Math.max(before.tris, 1))

await doc.transform(
  dedup(),
  flatten(),
  join(),
  // welding first is what lets the simplifier see a continuous surface rather
  // than a bag of disconnected triangles — without it the result shreds
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.001 }),
  prune(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [targetTex, targetTex] }),
  meshopt({ encoder: MeshoptEncoder }),
)

await io.write(output, doc)

const { size } = await import('node:fs').then(fs => fs.promises.stat(output))
const inSize = await import('node:fs').then(fs => fs.promises.stat(input))
console.log(
  [
    `  triangles  ${before.tris.toLocaleString()} → ${Math.round(countTris()).toLocaleString()}  (target ${targetTris.toLocaleString()})`,
    `  textures   ${before.textures} × 2048 → ${doc.getRoot().listTextures().length} × ${targetTex} webp`,
    `  file       ${(inSize.size / 1048576).toFixed(1)} MB → ${(size / 1048576).toFixed(2)} MB`,
  ].join('\n'),
)
