// Ships the "meet the tools" board: a nine-cell tray, one instrument per cell.
//
// One fix on the way through. The render has "Meet the Friendly Tools" painted
// across the top in English, and half this game's audience reads Arabic — the
// same defect as the clinic's wall sign. The lettering is replaced with the
// board's own cream so the frame, the little tooth and the stars all survive,
// and the real title is drawn by the app in whichever language the child chose.
//
// The cell rectangles are emitted alongside as JSON. The screen scratches those
// cells open, so the numbers have to come from the same place the picture does
// or the covers drift off their cells.
//
// Usage: node scripts/import-tools-board.mjs
import sharp from 'sharp'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC = resolve(import.meta.dirname, '../../art-in/source-art/tools/board.png')
const OUT = resolve(import.meta.dirname, '../public/art')

const W = 1100

/** The painted title, in shares of the source. Stops short of the tooth and the stars. */
const TITLE = { left: 0.175, top: 0.028, width: 0.685, height: 0.155 }

/**
 * The nine cells, measured off the render. Column edges then row edges, as
 * shares of the whole board — the screen positions its scratch covers from
 * these, so they live with the picture rather than in the component.
 */
const COLS = [
  [7.4, 34.2],
  [35.5, 62.6],
  [64.0, 92.4],
]
const ROWS = [
  [18.4, 41.2],
  [45.0, 67.0],
  [70.4, 92.5],
]

/** Reading order, matching the numbers printed in the cells. */
const ORDER = ['mirror', 'explorer', 'suction', 'syringe', 'brush', 'xray', 'ring', 'umbrella', 'spray']

const meta = await sharp(SRC).metadata()
const SW = meta.width
const SH = meta.height
const H = Math.round((SH / SW) * W)

const px = { left: Math.round(TITLE.left * SW), top: Math.round(TITLE.top * SH) }
const size = { width: Math.round(TITLE.width * SW), height: Math.round(TITLE.height * SH) }

// The board's own cream, taken from a clean strip of frame under the title.
const { data: sample } = await sharp(SRC)
  .extract({ left: Math.round(SW * 0.42), top: Math.round(SH * 0.172), width: 40, height: 8 })
  .raw()
  .toBuffer({ resolveWithObject: true })
let r = 0
let g = 0
let b = 0
for (let i = 0; i < sample.length; i += 3) {
  r += sample[i]
  g += sample[i + 1]
  b += sample[i + 2]
}
const n = sample.length / 3
const cream = { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) }
console.log(`board cream ≈ rgb(${cream.r}, ${cream.g}, ${cream.b})`)

// Feathered so it melts into the frame rather than showing as a filled box.
const patch = await sharp({
  create: { width: size.width, height: size.height, channels: 4, background: { ...cream, alpha: 1 } },
})
  .composite([
    {
      // A blurred rounded rectangle, not a radial. A radial across a wide, short
      // patch is already fading by the time it reaches the ends, which leaves
      // the first and last letters of the title still legible.
      input: Buffer.from(
        `<svg width="${size.width}" height="${size.height}">
           <defs><filter id="soft" x="-20%" y="-40%" width="140%" height="180%">
             <feGaussianBlur stdDeviation="9"/>
           </filter></defs>
           <rect x="12" y="12" width="${size.width - 24}" height="${size.height - 24}"
                 rx="26" fill="#ffffff" filter="url(#soft)"/>
         </svg>`,
      ),
      blend: 'dest-in',
    },
  ])
  .png()
  .toBuffer()

const cleaned = await sharp(SRC).composite([{ input: patch, ...px }]).png().toBuffer()

await sharp(cleaned).resize(W, H).webp({ quality: 86 }).toFile(resolve(OUT, 'tools-board.webp'))
console.log(`✓ tools-board.webp  ${W}x${H}   title silenced`)

// A blurred copy to sit behind it: the board is squarer than a phone, and a
// bare page colour around it reads as a picture pasted onto a form.
await sharp(cleaned)
  .resize(Math.round(W / 2), Math.round(H / 2))
  .blur(24)
  .modulate({ brightness: 1.05, saturation: 0.75 })
  .webp({ quality: 70 })
  .toFile(resolve(OUT, 'tools-board-bg.webp'))
console.log('✓ tools-board-bg.webp')

const cells = {}
ORDER.forEach((id, i) => {
  const [l, rr] = COLS[i % 3]
  const [t, bb] = ROWS[Math.floor(i / 3)]
  cells[id] = { left: l, top: t, width: Math.round((rr - l) * 10) / 10, height: Math.round((bb - t) * 10) / 10 }
})

writeFileSync(
  resolve(import.meta.dirname, '../src/content/tools-board.json'),
  JSON.stringify({ board: { width: W, height: H }, order: ORDER, cells }, null, 2) + '\n',
)
console.log('✓ src/content/tools-board.json')
for (const id of ORDER) console.log(`   ${id.padEnd(9)} ${cells[id].left}% ${cells[id].top}%  ${cells[id].width}x${cells[id].height}`)
