# Dental Adventure

A pre-visit game that helps children aged 4–8 meet the dental clinic before they ever sit in the chair — the room, the instruments, the dentist, and the steps of a real visit — so the first appointment is somewhere they have already been.

**Play it:** [dental-adventure-production.up.railway.app](https://dental-adventure-production.up.railway.app)

Bilingual Arabic/English with full RTL, narrated end to end for pre-readers, and playable with no connection after the first load.

## What's in it

The child picks a language, a parent picks the visit type (first checkup or treatment), and the game plays as a short sequence of activities — meet the clinic, meet the tools, practise brushing, prepare the tooth, a calm counting mission, then a walk-through of the visit itself — each one earning a star toward a Dental Hero certificate.

Design rules it holds to: no fail states, no needles or blood, nothing that startles. Every instruction is spoken as well as written. A child who taps nothing still moves forward.

A Facial Image Scale module — the pre/post anxiety measure clinics would need to use the game as research — is **planned but not built**. Nothing in the app collects, scores or exports a mood rating today. See `docs/blueprint-phase-0-inspection.md` §1.1; earlier drafts of this file and of `docs/poc-review/` claimed it already existed, and it never has.

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
  src/screens/   one file per screen, all sharing GameStage
  src/game/      GameStage, the HUD, Milo, and the tool rig
  src/three/     the 3D stage, reachable only from the ?stage3d=1 harness
  src/content/   copy and path manifests; the strings files drive the narration
  public/audio/  baked narration, one clip per string per language
docs/          the plan, the tracker, and the Arabic audio script
scripts/       narration generation and art import
```

Narration is baked ahead of time rather than spoken by the device, so it sounds the same on every phone and works offline. Three routes produce it, and they are not interchangeable:

- **Arabic** ships from human recordings, imported with `scripts/import-arabic-narration-used.mjs` from the local `Arabic-narration-used/` folder. That folder is gitignored, so those recordings exist only on this machine — they are the one asset here with no copy in the repo.
- **English** is synthesised by `scripts/generate-audio-edge.mjs` (Microsoft Edge neural TTS via `msedge-tts`, free, no key). This is the pipeline currently in use.
- `scripts/generate-audio.mjs` and `scripts/audition-voices.mjs` use ElevenLabs and want an `ELEVENLABS_API_KEY` in a root `.env`. The Edge route exists as the standing fallback for them.

Changing a string is therefore expensive: every edit costs a regenerated clip, and for Arabic it costs a new recording.

## Credits

Tool and character artwork adapted from Microsoft Fluent 3D (MIT).
