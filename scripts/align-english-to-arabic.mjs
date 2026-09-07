// Rewrites the English narration to say what the Arabic recordings actually
// say.
//
// The two scripts had drifted apart badly. English was not a translation of
// the Arabic at all — it was a separate, much shorter script written first,
// and the Arabic voice sessions went their own way. Measured against the
// transcripts in artifacts/arabic-transcripts.json, Arabic ran 7–11 seconds
// where English ran 2–4, and said different things: the Arabic suction is
// "Mister Thirsty, like a straw, so no sugar bugs go down into your tummy",
// the English was "I'm a straw! I drink up the water in your mouth."
//
// Every line below carries the meaning of the Arabic transcript for the same
// id, said as briefly as English can say it. The first pass at this translated
// the Arabic sentence for sentence and ran long — Egyptian Arabic is warm and
// unhurried, and rendered literally it filled the screen and outstayed the
// picture. Short sentences, one idea each.
//
// Usage: node scripts/align-english-to-arabic.mjs [--dry]
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const enPath = resolve(root, 'app/src/content/strings/en.json')

/** id → English that means what the Arabic recording says. */
const ALIGNED = {
  // ── the welcome ────────────────────────────────────────────────────────
  // "أهلًا يا بطل يا صغنون. النهاردة عندنا رحلة في عيادة الأسنان."
  'milo.welcome': "Hello, {name}! Today we're going on a trip to the dentist.",

  // ── the clinic ─────────────────────────────────────────────────────────
  // "أول خطوة إن إحنا هنتعرف على شوية حاجات موجودة معانا في العيادة..."
  'clinic.intro': "Let's meet the clinic, {name}. Press each thing to see what it does.",
  // "أنا كرسي الأسنان زي المرجيحة بطلع وبنزلها..."
  'clinic.chair.desc': "I'm the dental chair. I'm like a swing — up and down, so you stay comfy.",
  // "أنا بنور زي الشمس الشموسة عشان نعرف نشوف أسناننا كويس"
  'clinic.light.desc': "I shine like the sun, so we can see your teeth clearly.",
  // "أنا مستر عطشان زي الشاليمو بشفط المية من بقك..."
  'clinic.suction.desc': "I'm Mister Thirsty. I sip the water up, so none goes down your tummy.",
  // "أنا برش مية وهوا على الأسنان عشان نغسل أسنانك كويس وننشفها."
  'clinic.syringe.desc': "I puff water and air, to wash your teeth and dry them.",

  // ── the tools ──────────────────────────────────────────────────────────
  // "هنلعب لعبة، وهي إنك هتخربش الألوان الموجودة قدامك..."
  'tools.intro': "Let's play, {name}. Scratch each colour, and a tool pops out to say hello.",
  // "أنا المراية بنشوف فيها أسنانك كويس من كل الاتجاهات."
  'tool.mirror.desc': "I'm the mirror. I show your teeth from every side.",
  // "أنا عدّاي الأسنان اللي بيعد أسنانك..."
  'tool.explorer.desc': "I'm the tooth counter. I count your teeth and check every one.",
  // "أنا العصير السحري اللي بيترش على الأسنان عشان ينيّم السوسة..."
  'tool.spray.desc': "I'm the magic juice. I send the sugar bugs to sleep.",
  // "أنا الدش الصغنون بتاع الأسنان اللي بيرش مية كتييير..."
  'tool.brush.desc': "I'm the little shower. I wash your teeth until they're clean.",

  // ── the tooth ──────────────────────────────────────────────────────────
  // "دلوقتي بقى هنجرب مع بعض ازاي هنشيل السوسة الوحشة دي..."
  'prepare.intro': "Let's take the sugar bugs off this tooth, {name}.",
  // "أول خطوة إنك هترش العصير السحري على السن..."
  'prepare.step.spray': "First, the magic juice. It sends the sugar bugs to sleep.",
  // "تاني خطوة هتستخدم الدش الصغنون..."
  'prepare.step.brush': "Now the little shower. It washes them away.",
  // "كده انت قدرت تشيل كل السوسة... والسنة رجعت قوية"
  'prepare.done': "Every sugar bug gone! The tooth is strong again, {name}.",
  // "عاش يا نجم نظفتها"
  'milo.praise.1': "Well done, {name}! You cleaned it.",
  // "شوف كده بقت لامعة"
  'milo.praise.2': "Look — it's shiny now!",
  // "حلو دي دغدغة السنة شوية"
  'milo.praise.3': "Nice. That tickled a little!",
  // "برافو يا بطل السنان إيدك خفيفة"
  'milo.praise.4': "Bravo! Such gentle hands.",

  // ── the visit ──────────────────────────────────────────────────────────
  // carries the Arabic meetDr and maskPrompt
  'visit.meetDr': "Let's meet your dentist, {name}. Hello! I wear a mask, but I'm smiling underneath. Tap it.",
  // "شفت بقى على طول هقوم بضحك لك..."
  'visit.maskOff': "See? I'm smiling at you the whole time.",
  // carries the Arabic handPrompt and stopSignal
  'visit.stopSignal':
    "We're a team, {name}. Here's our deal: if anything bothers you, raise your hand. I'll stop straight away. Try it!",
  // "بالظبط كده. شاطر يا بطل يا صغننون"
  'visit.stopSignalDone': "Exactly like that. Well done, {name}!",
  // the four steps below are one recording in Arabic (visit.simulation)
  'visit.simulation': "Let's walk through the whole visit together.",
  'visit.step.chair': "First, you sit in the chair. It goes up and down.",
  'visit.step.light': "Then the light comes on, so I can see your teeth.",
  'visit.step.mirror': "Next, the mirror shows me every side.",
  'visit.step.sleepy': "Then the magic juice sends the sugar bugs to sleep.",
  // "تغمض عينك وتعد من واحد لعشرة"
  'visit.step.count': "Close your eyes, and count with me to ten.",
  // "بعد كده هستخدم الدش الصغنون عشان أغسل أسنانك كويس أوي..."
  'visit.step.clean': "Last, the little shower washes them all away.",

  // ── between the modules ────────────────────────────────────────────────
  // "شاطر جدًا يا بطل... عديت أول خطوة"
  'story.calmer1': "Well done, {name}. That's the clinic — you know it now.",
  // "كده احنا خلصنا تاني خطوة في رحلتنا"
  'story.calmer2': "Second step done. You know the tools now.",
  // "واااو... السنة رجعت قوية. شاطر جدا"
  'story.calmer3': "The sugar bugs are gone and the tooth is strong. Well done, {name}.",

  // ── the certificate ────────────────────────────────────────────────────
  // "خلصنا رحلتنا... ودي شهادة تقدير في اسمك"
  'reward.narration': "We did it, {name}! Here's your certificate, with your name on it.",
}

const en = JSON.parse(readFileSync(enPath, 'utf8'))
const missing = Object.keys(ALIGNED).filter(k => !(k in en))
if (missing.length) {
  console.error('these ids are not in en.json:', missing.join(', '))
  process.exit(1)
}

let changed = 0
for (const [id, text] of Object.entries(ALIGNED)) {
  if (en[id] === text) continue
  console.log(`\n${id}\n  was: ${en[id]}\n  now: ${text}`)
  en[id] = text
  changed++
}

if (process.argv.includes('--dry')) {
  console.log(`\n(dry run) ${changed} lines would change`)
} else {
  writeFileSync(enPath, `${JSON.stringify(en, null, 2)}\n`)
  console.log(`\n${changed} lines rewritten in en.json`)
}
