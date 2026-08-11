// One-off: download Baloo 2 (latin) + Baloo Bhaijaan 2 (arabic+latin) woff2 files
// from Google Fonts and emit app/src/fonts.css with local @font-face rules.
import { mkdirSync, writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const cssUrl = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700&family=Baloo+Bhaijaan+2:wght@500;700&display=swap'

const css = await (await fetch(cssUrl, { headers: { 'User-Agent': UA } })).text()
mkdirSync('app/public/fonts', { recursive: true })

const blocks = [...css.matchAll(/\/\* ([\w-]+) \*\/\s*@font-face \{([^}]+)\}/g)]
let out = ''
let i = 0
for (const [, subset, body] of blocks) {
  const family = body.match(/font-family: '([^']+)'/)[1]
  const weight = body.match(/font-weight: (\d+)/)[1]
  const url = body.match(/url\((https:[^)]+\.woff2)\)/)[1]
  const range = body.match(/unicode-range: ([^;]+);/)[1]
  // keep only the subsets we need
  if (family === 'Baloo 2' && subset !== 'latin') continue
  if (family === 'Baloo Bhaijaan 2' && !['arabic', 'latin'].includes(subset)) continue
  const file = `${family.replaceAll(' ', '')}-${weight}-${subset}-${i++}.woff2`
  const buf = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer())
  writeFileSync(`app/public/fonts/${file}`, buf)
  out += `@font-face {\n  font-family: '${family}';\n  font-style: normal;\n  font-weight: ${weight};\n  font-display: swap;\n  src: url('/fonts/${file}') format('woff2');\n  unicode-range: ${range};\n}\n`
  console.log('✓', file, `(${(buf.length / 1024).toFixed(0)} KB)`)
}
writeFileSync('app/src/fonts.css', out)
console.log('wrote app/src/fonts.css with', out.split('@font-face').length - 1, 'faces')
