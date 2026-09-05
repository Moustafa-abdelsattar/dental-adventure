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
// Every line below is a translation of the Arabic transcript for the same id,
// keeping the app's established English vocabulary (magic juice, little
// shower, sticky spots) and its {name} placeholder wherever the Arabic
// addresses the child directly as "يا بطل يا صغنون".
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
  'milo.welcome': "Hello there, {name}! Today we're going on a trip to the dental clinic.",

  // ── the clinic ─────────────────────────────────────────────────────────
  // "أول خطوة إن إحنا هنتعرف على شوية حاجات موجودة معانا في العيادة..."
  'clinic.intro':
    "First we're going to get to know some of the things here in the clinic. Press on each one, {name}, and it will tell you what it does.",
  // "أنا كرسي الأسنان زي المرجيحة بطلع وبنزلها..."
  'clinic.chair.desc':
    "I'm the dental chair. I'm like a swing — I go up and I come down, so you stay comfy and happy while we fight the sugar bugs.",
  // "أنا بنور زي الشمس الشموسة عشان نعرف نشوف أسناننا كويس"
  'clinic.light.desc': "I shine like the warm sunshine, so we can see your teeth nice and clearly.",
  // "أنا مستر عطشان زي الشاليمو بشفط المية من بقك عشان السوسة ما تنزلش في بطنك"
  'clinic.suction.desc':
    "I'm Mister Thirsty. I'm like a straw — I sip the water out of your mouth, so no sugar bugs go down into your tummy.",
  // "أنا برش مية وهوا على الأسنان عشان نغسل أسنانك كويس وننشفها."
  'clinic.syringe.desc': "I puff water and air onto your teeth, to wash them well and dry them off.",

  // ── the tools ──────────────────────────────────────────────────────────
  // "هنلعب لعبة، وهي إنك هتخربش الألوان الموجودة قدامك..."
  'tools.intro':
    "Let's play a game, {name}. Scratch the colours in front of you, and each tool will appear and tell you what it does.",
  // "أنا المراية بنشوف فيها أسنانك كويس من كل الاتجاهات."
  'tool.mirror.desc': "I'm the mirror. We look in me to see your teeth clearly, from every side.",
  // "أنا عدّاي الأسنان اللي بيعد أسنانك وبيتأكد إنها ما فيهاش أي سوسة"
  'tool.explorer.desc':
    "I'm the tooth counter. I count your teeth one by one and make sure no sugar bugs are hiding in them.",
  // "أنا العصير السحري اللي بيترش على الأسنان عشان ينيّم السوسة..."
  'tool.spray.desc':
    "I'm the magic juice. I get sprayed on the tooth to send the sugar bugs to sleep, so we can catch them and they can't run around your mouth.",
  // "أنا الدش الصغنون بتاع الأسنان اللي بيرش مية كتييير..."
  'tool.brush.desc':
    "I'm the little tooth shower. I sprinkle lots and lots of water to wash your teeth really well and take away any sugar bugs.",

  // ── the tooth ──────────────────────────────────────────────────────────
  // "دلوقتي بقى هنجرب مع بعض ازاي هنشيل السوسة الوحشة دي من على أسنانك."
  'prepare.intro': "Now let's try together, {name}, how we take those sugar bugs off your tooth.",
  // "أول خطوة إنك هترش العصير السحري على السن علشان السوسة تموت"
  'prepare.step.spray': "First step: spray the magic juice on the tooth, to send the sugar bugs to sleep.",
  // "تاني خطوة هتستخدم الدش الصغنون عشان تشيل السوسة الموجودة على السنّة."
  'prepare.step.brush': "Second step: use the little shower to take the sugar bugs off the tooth.",
  // "كده انت قدرت تشيل كل السوسة الموجودة على السنة والسنة رجعت قوية..."
  'prepare.done':
    "There — you took away every sugar bug, and the tooth is strong again. Very well done, {name}.",
  // "عاش يا نجم نظفتها"
  'milo.praise.1': "Well done, {name} — you cleaned it!",
  // "شوف كده بقت لامعة"
  'milo.praise.2': "Look at that — it's shiny now!",
  // "حلو دي دغدغة السنة شوية"
  'milo.praise.3': "Lovely. That tickled the tooth a little!",
  // "برافو يا بطل السنان إيدك خفيفة"
  'milo.praise.4': "Bravo, tooth hero — you have such gentle hands!",

  // ── the visit ──────────────────────────────────────────────────────────
  // AR splits this over visit.meetDr + visit.maskPrompt; English has one line,
  // so it carries both: "دلوقتي هنتعرف مع بعض على الدكتور..." and
  // "أهلًا يا بطل يا صغنون. أنا الدكتور اللي هكون موجودة معاك في العيادة..."
  'visit.meetDr':
    "Now let's meet the dentist who will be with you in the clinic. Hello, {name}! I'm your dentist. You'll always find me wearing a mask — but I'm smiling at you underneath it. Try pressing on it.",
  // "شفت بقى على طول هقوم بضحك لك طول ما انت بطل شطور"
  'visit.maskOff': "See? I'll be smiling at you the whole time, as long as you're my brave hero.",
  // AR splits this over visit.handPrompt + visit.stopSignal; English has one.
  'visit.stopSignal':
    "You and I are going to be friends and fight the sugar bugs together, {name}. I'll help your teeth grow strong and beautiful again. So here is our agreement: you're a brave hero, you'll sit in the dental chair, and if anything bothers you at all, you raise your hand — and I will stop straight away. Let's try it together now.",
  // "بالظبط كده. شاطر يا بطل يا صغننون"
  'visit.stopSignalDone': "Exactly like that. Well done, {name}!",
  // The four steps below are spoken as one recording in Arabic
  // (visit.simulation); English says them one at a time, so each takes its
  // sentence from that recording.
  'visit.simulation': "Now let's go through all the steps together, from the moment you come into the clinic.",
  'visit.step.chair': "First step: you'll sit on the dental chair. It's a lovely chair, and it goes up and it comes down.",
  'visit.step.light': "Then I'll turn on the light, so I can see your teeth nice and clearly.",
  'visit.step.mirror': "After that I'll use the mirror, to see your teeth from every direction.",
  'visit.step.sleepy':
    "And when I know where the sugar bugs are, I'll spray the magic juice on them, so they go to sleep and I can take them away.",
  // "عشان العصير ده بتاع السوسة بس... تغمض عينك وتعد من واحد لعشرة"
  'visit.step.count':
    "This juice is only for the sugar bugs, so close your eyes for me and count along from one to ten.",
  // "بعد كده هستخدم الدش الصغنون عشان أغسل أسنانك كويس أوي..."
  'visit.step.clean':
    "After that I'll use the little shower, to wash your teeth really well and take away every sugar bug, so they're strong and beautiful again.",

  // ── between the modules ────────────────────────────────────────────────
  // "شاطر جدًا يا بطل يا صغنون، أنت كده عديت أول خطوة..."
  'story.calmer1': "Very well done, {name}. You've finished the first step — you know the main things in the clinic now.",
  // "كده احنا خلصنا تاني خطوة في رحلتنا بإنك تعرف عيادة الأسنان"
  'story.calmer2': "That's the second step of our trip done. You're really getting to know the dental clinic.",
  // "واااو. إمتى قدرت تشيل كل السوس الموجود على السنة والسنة رجعت قوية..."
  'story.calmer3': "Wow! You took away all the sugar bugs and the tooth is strong again. Very well done, {name}.",

  // ── the certificate ────────────────────────────────────────────────────
  // "وااااو كده احنا خلصنا رحلتنا في عيادة الأسنان. ودي شهادة تقدير في اسمك..."
  'reward.narration':
    "Wow! We've finished our trip to the dental clinic. And here is a certificate with your name on it, {name}, because you were so brilliant today.",
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
