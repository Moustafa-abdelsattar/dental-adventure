import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const workspaceRoot = resolve(process.cwd())
const manifestPath = resolve(workspaceRoot, 'Arabic-narration-used/manifest.json')
const ids = process.argv.slice(2)

if (!existsSync(manifestPath)) {
  console.error('Missing Arabic-narration-used/manifest.json. Build the review folder first.')
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const selected = ids.length ? manifest.filter(entry => ids.includes(entry.id)) : manifest
const missingIds = ids.filter(id => !manifest.some(entry => entry.id === id))

if (missingIds.length) {
  console.error(`Unknown audio ID(s): ${missingIds.join(', ')}`)
  process.exit(1)
}

function insideWorkspace(path) {
  const resolved = resolve(path)
  return resolved === workspaceRoot || resolved.startsWith(`${workspaceRoot}\\`) || resolved.startsWith(`${workspaceRoot}/`)
}

for (const entry of selected) {
  const exactSource = resolve(workspaceRoot, 'Arabic-narration-used', entry.cleanRecording)
  const sourceCandidates = [
    resolve(workspaceRoot, 'Arabic-narration-used/recordings', `${entry.id}.m4a.mp4`),
    resolve(workspaceRoot, 'Arabic-narration-used/recordings', `${entry.id}.m4a`),
    resolve(workspaceRoot, 'Arabic-narration-used/recordings', `${entry.id}.mp4`),
    resolve(workspaceRoot, 'Arabic-narration-used/recordings', `${entry.id}.ogg`),
    resolve(workspaceRoot, 'Arabic-narration-used/recordings', `${entry.id}.mp3`),
    exactSource,
  ]
  const source = sourceCandidates.find(candidate => existsSync(candidate))
  const target = resolve(workspaceRoot, entry.target)

  if (!source || !insideWorkspace(source) || !insideWorkspace(target)) {
    console.error(`Refusing path outside workspace for ${entry.id}`)
    process.exit(1)
  }
  if (!existsSync(source)) {
    console.error(`Missing replacement file for ${entry.id}: ${exactSource}`)
    process.exit(1)
  }
  if (!existsSync(dirname(target))) {
    console.error(`Missing target directory for ${entry.id}: ${dirname(target)}`)
    process.exit(1)
  }

  const args = ['-y', '-hide_banner', '-i', source, '-c:a', 'libmp3lame', '-b:a', entry.id === 'decay-removal-sfx' ? '128k' : '96k', target]
  const result = spawnSync('ffmpeg', args, { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
  console.log(`Imported ${entry.id} -> ${entry.target}`)
}
