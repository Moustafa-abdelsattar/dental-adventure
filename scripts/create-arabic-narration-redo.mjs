import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = 'Arabic-narration-redo'
const strings = JSON.parse(readFileSync('app/src/content/strings/ar.json', 'utf8'))

const groups = [
  ['00-start-and-setup', ['lang.greet', 'milo.welcome', 'milo.welcomeBack']],
  [
    '01-shared-milo-lines',
    [
      'milo.hint.tap',
      'milo.great',
      'milo.praise.1',
      'milo.praise.2',
      'milo.praise.3',
      'milo.praise.4',
      'milo.starEarned',
      'story.calmer1',
      'story.calmer2',
      'story.calmer3',
      'story.reversal',
      'story.together',
    ],
  ],
  [
    '02-clinic-exploration',
    [
      'clinic.title',
      'clinic.intro',
      'clinic.chair.name',
      'clinic.chair.desc',
      'clinic.light.name',
      'clinic.light.desc',
      'clinic.suction.name',
      'clinic.suction.desc',
      'clinic.syringe.name',
      'clinic.syringe.desc',
      'clinic.sink.name',
      'clinic.sink.desc',
      'clinic.table.name',
      'clinic.table.desc',
      'clinic.done',
    ],
  ],
  [
    '03-tools-scratch',
    [
      'tools.title',
      'tools.intro',
      'tools.groupDone',
      'tools.done',
      'tool.mirror.name',
      'tool.mirror.desc',
      'tool.mirror.fact',
      'tool.explorer.name',
      'tool.explorer.desc',
      'tool.explorer.fact',
      'tool.spray.name',
      'tool.spray.desc',
      'tool.spray.fact',
      'tool.brush.name',
      'tool.brush.desc',
      'tool.brush.fact',
    ],
  ],
  ['04-practice-brushing', ['practice.brush.title', 'practice.brush.intro', 'practice.brush.done']],
  [
    '05-prepare-tooth-treatment',
    [
      'prepare.title',
      'prepare.intro',
      'prepare.step.spray',
      'prepare.step.brush',
      'prepare.step.scrub',
      'prepare.done',
    ],
  ],
  [
    '06-calm-counting',
    [
      'spray.title',
      'spray.intro',
      'spray.count.1',
      'spray.count.2',
      'spray.count.3',
      'spray.count.4',
      'spray.count.5',
      'spray.count.6',
      'spray.count.7',
      'spray.count.8',
      'spray.count.9',
      'spray.count.10',
      'spray.done',
    ],
  ],
  [
    '07-dentist-visit',
    [
      'visit.title',
      'visit.meetDr',
      'visit.maskPrompt',
      'visit.maskOff',
      'visit.stopSignal',
      'visit.handPrompt',
      'visit.stopSignalDone',
      'visit.simulation',
      'visit.step.chair',
      'visit.step.light',
      'visit.step.mirror',
      'visit.step.sleepy',
      'visit.step.clean',
      'visit.done',
    ],
  ],
  ['08-final-reward-and-certificate', ['reward.congrats', 'reward.hero', 'reward.narration']],
  [
    '09-unused-legacy-tool-lines',
    [
      'tool.suction.name',
      'tool.suction.desc',
      'tool.suction.fact',
      'tool.syringe.name',
      'tool.syringe.desc',
      'tool.syringe.fact',
      'tool.xray.name',
      'tool.xray.desc',
      'tool.xray.fact',
      'tool.ring.name',
      'tool.ring.desc',
      'tool.ring.fact',
      'tool.umbrella.name',
      'tool.umbrella.desc',
      'tool.umbrella.fact',
      'prepare.step.ring',
      'prepare.step.umbrella',
    ],
  ],
  [
    '10-ui-labels-not-main-narration',
    [
      'app.title',
      'app.subtitle',
      'ui.start',
      'ui.next',
      'ui.playAgain',
      'ui.certificate',
      'ui.shareCertificate',
      'ui.printCertificate',
      'ui.hudTitle',
      'ui.startOver',
      'ui.startOverConfirm',
      'parent.forParents',
      'parent.whichVisit',
      'parent.checkup',
      'parent.treatment',
      'parent.childName',
      'parent.namePlaceholder',
      'parent.skip',
      'cert.title',
      'cert.awardedTo',
      'cert.for',
      'cert.defaultName',
      'friend.vocative',
    ],
  ],
]

const used = new Set()

mkdirSync(root, { recursive: true })
writeFileSync(
  join(root, 'README.md'),
  [
    '# Arabic Narration Redo',
    '',
    'This folder is only for the new Arabic narration recording pass.',
    '',
    '- Put each new recording in the matching `recordings/` folder.',
    '- Best filename format: the exact audio ID, for example `prepare.step.brush.ogg`.',
    '- The `app target file` column is where I will import each clip after recording.',
    '- `{name}` is the child name placeholder. Record it with a natural pause, or record a no-name version if preferred.',
    '- `09-unused-legacy-tool-lines` is kept separate because those lines still exist in the string table but are not part of the current main treatment flow.',
    '- `10-ui-labels-not-main-narration` is mostly buttons, headings, and certificate text.',
    '',
    'When all clips are ready, I can convert them, normalize levels, and sync the visuals to the new durations.',
    '',
  ].join('\n'),
  'utf8',
)

for (const [folder, ids] of groups) {
  const dir = join(root, folder)
  const recordingsDir = join(dir, 'recordings')
  mkdirSync(recordingsDir, { recursive: true })
  writeFileSync(join(recordingsDir, 'PLACE_NEW_RECORDINGS_HERE.txt'), 'Drop recordings for this part here.\n', 'utf8')

  const rows = [
    `# ${folder.replace(/^\d+-/, '').replaceAll('-', ' ')}`,
    '',
    '| Audio ID | App target file | Current Arabic text |',
    '|---|---|---|',
  ]

  for (const id of ids) {
    used.add(id)
    const text = strings[id] ?? '(missing from app/src/content/strings/ar.json)'
    rows.push(`| \`${id}\` | \`app/public/audio/ar/${id}.mp3\` | ${String(text).replaceAll('|', '/')} |`)
  }

  writeFileSync(join(dir, 'script.md'), `${rows.join('\n')}\n`, 'utf8')
}

const missing = Object.keys(strings).filter(id => !used.has(id))
if (missing.length) {
  const dir = join(root, '99-uncategorized')
  const recordingsDir = join(dir, 'recordings')
  mkdirSync(recordingsDir, { recursive: true })
  writeFileSync(join(recordingsDir, 'PLACE_NEW_RECORDINGS_HERE.txt'), 'Drop uncategorized recordings here.\n', 'utf8')
  writeFileSync(
    join(dir, 'script.md'),
    [
      '# uncategorized',
      '',
      '| Audio ID | App target file | Current Arabic text |',
      '|---|---|---|',
      ...missing.map(id => `| \`${id}\` | \`app/public/audio/ar/${id}.mp3\` | ${String(strings[id]).replaceAll('|', '/')} |`),
      '',
    ].join('\n'),
    'utf8',
  )
}

console.log(`Created ${root}`)
console.log(`Part folders: ${groups.length}${missing.length ? ' plus 99-uncategorized' : ''}`)
console.log(`Audio IDs covered: ${Object.keys(strings).length}`)
