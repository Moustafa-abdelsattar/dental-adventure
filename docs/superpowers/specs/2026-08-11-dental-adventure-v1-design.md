# Dental Adventure v1 — Design Spec

**Date:** 2026-08-11 · **Status:** Approved by owner (with additions: step-by-step build w/ tests, premium UI/UX + motion, unified tool art)
**Sources:** spec board photo (`docs/photo_2026-08-11_16-40-37.jpg`), owner's approach doc (`dental-adventure-interactive-game-approach.md`, treated as inspiration), 6-agent investigation (2026-08-11).

## 1. What it is

A single-URL, portrait, mobile-first **web app (PWA)** that dentists send to parents before a child's (age 4–8) visit. The child plays at home with a parent nearby, meets the clinic, the tools, and the dentist through Milo the Tooth, and arrives at the real visit unafraid. Bilingual **Arabic + English** (full text and voice). Works offline after first load. No login, no ads, no external links, no data collection in v1.

**Explicitly out of v1:** research module (Facial Image Scale, CSV export), 3D/Three.js, Rive, doctor dashboard, app-store builds.

## 2. Flow

1. **Language screen** — two large self-voicing buttons (each speaks its own greeting in its own language on appear/tap). Choice persists; never shown again (changeable via a small parent corner control).
2. **Parent moment** — "Which visit is your child having?" → **First Checkup** / **Treatment Visit**, two big illustrated buttons. Skipped when the URL has `?visit=checkup` or `?visit=treatment` (doctor-preset links). Same screen asks **"What's your child's name?"** — optional text input (Arabic or English keyboard), skippable.
3. **Welcome** — logo, Milo floats/blinks/waves, big pulsing START.
4. **Adventure modules** (linear, per path — §3).
5. **Reward** — 5 stars complete → confetti → "You are now a DENTAL HERO!" → certificate.

Persistent **HUD**: Milo (tap = replay current line) + 5-star progress row. Earned stars fly physically into the HUD. Progress persists in localStorage; returning children resume with a spoken "Welcome back!"

## 3. Content per path — star economy (always totals 5)

| # | First Checkup path | ★ | Treatment Visit path | ★ |
|---|---|---|---|---|
| 1 | Clinic Explore (4 objects: chair, light, sink, table) | +1 | Clinic Explore (same) | +1 |
| 2 | Meet the Tools — 6 tools, two groups of 3 | +2 | Meet the Tools — 9 tools, three groups of 3 | +1 |
| 3 | Tooth Practice — brush & rinse mini-game | +1 | Prepare the Tooth — ring → umbrella → sleepy spray | +1 |
| 4 | — | | Sleepy Spray Mission — audio-only calm count to 10 | +1 |
| 5 | Meet the Dentist & Visit Simulation | +1 | Meet the Dentist & Visit Simulation | +1 |

Rules: stars **never reset**; Dental Hero status permanent; Play Again = free-play (stars stay full). Simulation always awards the final star. Group completion shown by a tooth that gets shinier (no reading/counting needed).

**Tools roster:** 1 Dental Mirror, 2 Explorer ("Tooth Counter"), 3 Suction ("Thirsty Straw"), 4 Air-Water Syringe, 5 Polishing Brush, 6 X-ray Wand (redrawn: small photo-wand, "takes a super picture of your teeth", NO flash/click), 7 Tooth Hugger Ring, 8 Tooth Umbrella, 9 Magic Sleepy Spray. Tools 7–9 appear only on the Treatment path.

## 4. Cast

- **Milo the Tooth** — layered SVG (body / arms / eyes / brows / mouth / cheeks / shadow) driven by a Motion state machine: `idle, blink, talk, wave, point, happy, celebrate`. Mouth flaps while narration plays. React API: `<Milo trigger="wave" talking={bool} />`.
- **Dr. Nour** — friendly dentist (name works in AR + EN). Simulation opens with the **mask-on/mask-off reveal** ("It's still Dr. Nour underneath!") and teaches the **raise-your-hand stop signal**. This addresses the board's biggest gap (no human dentist anywhere).
- **Peer child** — one fixed happy child character in the chair (symbolic modeling).

## 4b. Personalization (child's name)

- Name entered by the parent at the parent moment (optional; default display name: "my friend" / "يا صديقي"). Stored locally with the rest of progress.
- **Written text is personalized everywhere:** all Milo speech-bubble strings are templates with a `{name}` slot ("Great job, Omar!" / "!أحسنت يا عمر"); the HUD title reads "<Name>'s Adventure"; the certificate "Awarded To:" auto-fills from it (still editable there).
- **Audio stays name-free in v1** (clips are pre-generated): voiced lines use warm vocatives ("my hero!", "my friend!", "يا بطل", "يا صديقي") so speech and text never contradict — text shows the name where audio says the vocative.
- v2 option (not in v1): synthesize name audio once at entry while online, cache it, splice after greeting clips.
- Tests: `{name}` templating renders in both languages, RTL Arabic names render correctly inside RTL and LTR sentences, skip path falls back to the default, name persists across reload and flows into the certificate.

## 5. Copy rules (honest preparation)

- Sensory language, never absolute promises: "tickly", "buzzy", "cold like a little wind" — never "it never hurts" / "no pain".
- Sleepy Spray: "helps your tooth feel cozy and calm" — no claims about what comes after; mission success is unconditional ("Great counting with me!"), never claims to verify closed eyes.
- AVOID list enforced: no needles, blood, extraction, scary imagery, crying children, harsh sounds, no camera flash, no countdown pressure.

## 6. Visual & motion system (premium bar)

- **Design quality:** implementation consults the installed premium design skills (impeccable / emil-design-eng / frontend-design / ui-ux-pro-max) at the appropriate build steps. Bright, cheerful, rounded; large type; Baloo 2 (Latin) + Baloo Bhaijaan 2 (Arabic) bundled locally.
- **Unified tool family:** all 9 tools drawn in ONE SVG design language — same stroke weight, same rounded geometry, same palette roles, same subtle face system (every tool gets a friendly face, including the Explorer), same card layout, same animation grammar (appear → demo loop → sparkle). A shared `<ToolCard>` + per-tool SVG built from common primitives.
- **Motion tokens** (from approach doc): `soft` (stiffness 180/damping 20) for cards & modals, `playful` (350/16) for rewards, `snappy` (500/28) for buttons & drag. Background decor slow linear. Balance: ~70% stable / 20% micro / 10% wow. Stars physically fly to HUD; success = star burst; wrong tap = gentle wiggle + hint (no red, no failure).
- **Decor:** hand-built SVG blobs/clouds/waves (Haikei-style), subtly floating.

## 7. Child-UX rules

Tap-first everywhere (drag optional sugar); targets ≥ 2 cm with hit-slop; sequences enforced by highlighting only the correct next item; idle ~10 s → spoken nudge + pulsing target; music ducks under narration; new tap interrupts current clip; interactive content in lower ⅔ of screen; session designed to be completable in 2 sittings (resume at any star boundary).

## 8. Tech architecture

- **Stack:** Vite + React + TypeScript, Tailwind (logical properties → automatic RTL mirroring via `dir="rtl"`), Motion (framer-motion), vite-plugin-pwa (precache incl. audio), zustand store persisted to localStorage (language, path, **child name**, stars, per-module progress).
- **Structure** (per approach doc): `components/ui`, `components/motion` (FadeIn, Pop, Floating, StarBurst), `game/Milo`, `game/Tools`, `screens/`, `content/` (manifests), `audio/`.
- **Content manifests:** per-path JSON (`checkup.json`, `treatment.json`) — module list, objects/tools, string ids, animation triggers, clip ids. Copy edits never touch code.
- **i18n:** `en.json` / `ar.json` keyed by string id; every id maps to `public/audio/{en,ar}/<id>.mp3`.
- **Audio engine:** single AudioController — unlock on first tap, play-by-id with language prefix, interrupt-on-new, music ducking, replay via Milo tap.
- **TTS pipeline:** script (`scripts/generate-audio.mjs`, msedge-tts) generates all clips — EN voice **en-US-AnaNeural** (child voice), AR voice **ar-EG-SalmaNeural** (warm, Egyptian-accented; simple MSA script text). Clips regenerable/swappable for studio recordings later without code changes.

## 9. Testing (every step ships with tests)

- **Unit (vitest):** star economy per path (always 5, never resets), store persistence/resume, path preset from URL param, i18n completeness (every key in both languages), manifest integrity (every clip id has both audio files, every module's string ids exist).
- **E2E (Playwright):** full happy-path per path (language → path → all modules → reward), RTL smoke (Arabic renders `dir=rtl`, mirrored layout), resume-after-reload, offline reload after first visit (service worker).
- **Manual gate per phase:** run on a real phone-sized viewport; motion/feel review against the premium skills' checklists.

## 10. Build order (step-by-step, test-gated)

1. Scaffold + design system + motion tokens + tests running (CI-able).
2. Milo state machine + HUD + AudioController (with placeholder clips) + tests.
3. Language + parent-path + Welcome screens + i18n/RTL + tests.
4. Clinic Explore module + manifest system + tests.
5. Unified tool SVG family + Meet the Tools (both paths) + tests.
6. Practice modules (brush/rinse; prepare-the-tooth; sleepy spray) + tests.
7. Dr. Nour + Visit Simulation + tests.
8. Reward + certificate (share/save image, print secondary) + tests.
9. TTS generation (all ~55 lines × 2), audio completeness check, PWA/offline, performance pass on low-end viewport, full E2E.

Each step: implement → tests green → quick visual/motion review → next.
