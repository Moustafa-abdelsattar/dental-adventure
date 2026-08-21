// Draws the tools board for the four instruments the game now teaches.
//
// The board used to be a three-by-three tray of nine. Two of those nine — the
// suction and the air-water syringe — are met in the clinic room on the screen
// before this one, and the rest were more instruments than a four-year-old
// needs to hold in their head before a visit. Four is the set: the mirror that
// looks, the checker that counts, the juice that makes a tooth sleepy and the
// handpiece that cleans it.
//
// Leaving five cells of the old board uncovered was not an option — an open
// cell next to a covered one reads to a child as the one that failed to load,
// which is why every cell on the old board was always covered on both journeys.
// So the tray is redrawn at two by two, in its own palette, around the same
// four instrument renders the cards already use.
//
// Usage: node scripts/make-tools-board.mjs
import sharp from 'sharp'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Portrait, because the screen it stands on is. Drawn landscape, a two-by-two
// tray is sized by the width it is given and then leaves a band of empty stage
// under it deep enough to read as something failing to load.
const W = 1000
const H = 1100
const OUT = 'public/art'

// Sampled off the board this replaces, so the two are the same object.
const TRAY_EDGE = '#e3dac2'
const TRAY_FILL = '#f9f1dd'
const PANEL_FILL = '#f9f4e8'
const PANEL_EDGE = '#cfe6f2'
const BADGE = '#6cc3ec'

const PANEL = { w: 400, h: 390, gapX: 60, gapY: 60, x0: 70, y0: 160 }

/** In the order the child meets them, which is the order they are numbered. */
const TOOLS = [
  { id: 'mirror', col: 0, row: 0 },
  { id: 'explorer', col: 1, row: 0 },
  { id: 'spray', col: 0, row: 1 },
  { id: 'brush', col: 1, row: 1 },
]

const panelBox = t => ({
  left: PANEL.x0 + t.col * (PANEL.w + PANEL.gapX),
  top: PANEL.y0 + t.row * (PANEL.h + PANEL.gapY),
  width: PANEL.w,
  height: PANEL.h,
})

const panels = TOOLS.map((t, i) => {
  const b = panelBox(t)
  return `
    <rect x="${b.left}" y="${b.top}" width="${b.width}" height="${b.height}" rx="34"
          fill="${PANEL_FILL}" stroke="${PANEL_EDGE}" stroke-width="5"/>
    <circle cx="${b.left + 46}" cy="${b.top + 44}" r="27" fill="${BADGE}"/>
    <text x="${b.left + 46}" y="${b.top + 44}" fill="#ffffff" font-size="32" font-weight="700"
          font-family="Verdana, DejaVu Sans, sans-serif" text-anchor="middle" dominant-baseline="central">${i + 1}</text>`
}).join('')

// The two teeth and the stars the old tray wore in its corners, redrawn simply
// so the board still reads as a friendly thing rather than a form.
const trim = `
  <g opacity="0.55">
    <circle cx="${W - 92}" cy="88" r="13" fill="#bfe6f7"/>
    <circle cx="${W - 128}" cy="74" r="7" fill="#d7eec9"/>
    <circle cx="96" cy="84" r="14" fill="#f7e7a8"/>
    <circle cx="134" cy="72" r="7" fill="#f6cdd6"/>
  </g>`

const board = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
     <rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="52"
           fill="${TRAY_FILL}" stroke="${TRAY_EDGE}" stroke-width="18"/>
     ${trim}
     ${panels}
   </svg>`,
)

const layers = []
for (const t of TOOLS) {
  const b = panelBox(t)
  // Inset so no instrument touches its panel's edge or sits under its number.
  const padX = 44
  const padY = 52
  const fitW = b.width - padX * 2
  const fitH = b.height - padY * 2
  const art = await sharp(resolve(OUT, `tool-${t.id}.webp`))
    .resize({ width: fitW, height: fitH, fit: 'inside' })
    .png()
    .toBuffer()
  const m = await sharp(art).metadata()
  layers.push({
    input: art,
    left: b.left + Math.round((b.width - m.width) / 2),
    top: b.top + Math.round((b.height - m.height) / 2) + 10,
  })
}

await sharp(board).composite(layers).webp({ quality: 90 }).toFile(resolve(OUT, 'tools-board.webp'))
console.log(`✓ tools-board.webp   ${W}x${H}, four cells`)

const manifest = {
  board: { width: W, height: H },
  order: TOOLS.map(t => t.id),
  cells: Object.fromEntries(
    TOOLS.map(t => {
      const b = panelBox(t)
      return [
        t.id,
        {
          left: +((b.left / W) * 100).toFixed(1),
          top: +((b.top / H) * 100).toFixed(1),
          width: +((b.width / W) * 100).toFixed(1),
          height: +((b.height / H) * 100).toFixed(1),
        },
      ]
    }),
  ),
}
writeFileSync(resolve('src/content/tools-board.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log('✓ tools-board.json   cells measured from the drawing')
