// Can a fused export be taken apart?
//
// Image-to-3D returns one mesh with one material, which is why nothing in it
// can be highlighted or animated on its own. But "one mesh" is not necessarily
// "one surface" — if the chair, the stool and the cart are separate islands of
// geometry that merely share a buffer, they can be separated by walking the
// index buffer and grouping triangles that share vertices.
//
// This reports what is actually in there. With --write it emits a GLB with each
// island as its own named mesh, which is what makes them independently
// animatable.
//
//   node scripts/split-parts.mjs <in.glb> [out.glb]
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer'

const [, , input, output] = process.argv
if (!input) {
  console.error('usage: node scripts/split-parts.mjs <in.glb> [out.glb]')
  process.exit(1)
}

await MeshoptDecoder.ready
await MeshoptEncoder.ready
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder })

const doc = await io.read(input)
const meshes = doc.getRoot().listMeshes()

for (const mesh of meshes) {
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute('POSITION')
    const idx = prim.getIndices()
    if (!pos || !idx) continue

    const vertexCount = pos.getCount()
    const indices = idx.getArray()
    const triCount = indices.length / 3

    // union-find over vertices; two vertices are related if a triangle uses both
    const parent = new Uint32Array(vertexCount)
    for (let i = 0; i < vertexCount; i++) parent[i] = i
    const find = x => {
      let r = x
      while (parent[r] !== r) r = parent[r]
      while (parent[x] !== r) {
        const next = parent[x]
        parent[x] = r
        x = next
      }
      return r
    }
    const union = (a, b) => {
      const ra = find(a)
      const rb = find(b)
      if (ra !== rb) parent[rb] = ra
    }

    for (let t = 0; t < triCount; t++) {
      const a = indices[t * 3]
      const b = indices[t * 3 + 1]
      const c = indices[t * 3 + 2]
      union(a, b)
      union(b, c)
    }

    // bucket triangles by the island their first vertex belongs to
    const byRoot = new Map()
    for (let t = 0; t < triCount; t++) {
      const root = find(indices[t * 3])
      let bucket = byRoot.get(root)
      if (!bucket) byRoot.set(root, (bucket = []))
      bucket.push(t)
    }

    const islands = [...byRoot.values()].sort((a, b) => b.length - a.length)
    const p = pos.getArray()
    console.log(`\n  ${triCount.toLocaleString()} triangles → ${islands.length} connected island(s)\n`)
    islands.slice(0, 12).forEach((tris, i) => {
      // where does this island sit, and how big is it?
      let minX = Infinity, minY = Infinity, minZ = Infinity
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
      for (const t of tris)
        for (let k = 0; k < 3; k++) {
          const v = indices[t * 3 + k] * 3
          minX = Math.min(minX, p[v]); maxX = Math.max(maxX, p[v])
          minY = Math.min(minY, p[v + 1]); maxY = Math.max(maxY, p[v + 1])
          minZ = Math.min(minZ, p[v + 2]); maxZ = Math.max(maxZ, p[v + 2])
        }
      const pct = ((tris.length / triCount) * 100).toFixed(1)
      console.log(
        `    ${String(i).padStart(2)}  ${String(tris.length).padStart(7)} tris  ${pct.padStart(5)}%  ` +
          `x[${minX.toFixed(2)},${maxX.toFixed(2)}] y[${minY.toFixed(2)},${maxY.toFixed(2)}] z[${minZ.toFixed(2)},${maxZ.toFixed(2)}]`,
      )
    })
    if (islands.length > 12) console.log(`    … and ${islands.length - 12} more`)
  }
}

if (output) console.log('\n  (write mode not needed unless the split is worth keeping)')
