# Dental Adventure

A pre-visit game that helps children aged 4–8 meet the dental clinic before they ever sit in the chair — the room, the instruments, the dentist, and the steps of a real visit — so the first appointment is somewhere they have already been.

**Play it:** [dental-adventure-production.up.railway.app](https://dental-adventure-production.up.railway.app)

Bilingual Arabic/English with full RTL, narrated end to end for pre-readers, and playable with no connection after the first load.

## What's in it

The child picks a language, a parent picks the visit type (first checkup or treatment), and the game plays as a short sequence of activities — meet the clinic, meet the tools, practise brushing, prepare the tooth, a calm counting mission, then a walk-through of the visit itself — each one earning a star toward a Dental Hero certificate.

Design rules it holds to: no fail states, no needles or blood, nothing that startles. Every instruction is spoken as well as written. A child who taps nothing still moves forward.

It also carries a Facial Image Scale module for measuring dental anxiety before and after play, for clinics using the game as part of research.

## Running it

```bash
cd app
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # typecheck + production build
npx vitest run     # unit tests
npx playwright test # full play-throughs, EN and AR
node scripts/sweep.mjs          # screenshot every screen (needs a preview server on 4517)
node scripts/measure-layout.mjs # assert every screen aligns to the same grid
```

## Layout

```
app/           the game — React 19, Vite, Tailwind 4, Zustand, Motion
  src/screens/   one file per screen, all sharing ModuleFrame
  src/content/   copy and path manifests; the strings files drive the narration
  public/audio/  baked narration, one clip per string per language
docs/          the plan, the tracker, and the Arabic audio script
scripts/       narration generation (ElevenLabs) and art import
```

Narration is generated ahead of time rather than spoken by the device, so it sounds the same on every phone and works offline. Regenerating it needs an `ELEVENLABS_API_KEY` in a root `.env`.

## Credits

Tool and character artwork adapted from Microsoft Fluent 3D (MIT).
