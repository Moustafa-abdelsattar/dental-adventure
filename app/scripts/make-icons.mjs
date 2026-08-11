// Renders the favicon SVG to the PWA PNG icons using Playwright's chromium.
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const svg = readFileSync(resolve(root, 'public/favicon.svg'), 'utf8')

const browser = await chromium.launch()
for (const size of [512, 192]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  await page.setContent(
    `<body style="margin:0;background:#7ec8f2;display:grid;place-items:center;width:${size}px;height:${size}px">
       <div style="width:78%;height:78%">${svg.replace('<svg ', '<svg style="width:100%;height:100%" ')}</div>
     </body>`,
  )
  await page.screenshot({ path: resolve(root, `public/icon-${size}.png`) })
  await page.close()
  console.log(`✓ icon-${size}.png`)
}
await browser.close()
