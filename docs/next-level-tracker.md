# Next-Level Plan — progress tracker

Source: [next-level-plan.md](next-level-plan.md). Update the checkboxes as items land.

## Priority 0 — Fix the product structure
- [x] P0.1 Make Check-up & Cleaning the default module
- [x] P0.2 Move treatment tools into optional journeys
- [ ] P0.3 One uninterrupted 6–8 minute path
- [x] P0.4 Milo story arc (beginning → emotional change → role reversal → shared ending)
- [x] P0.5 Replace "no pain"/"magic" promises with truthful preparation copy
- [x] P0.6 Reduce mandatory tool set to four (mirror, suction, air/water, polisher)

## Priority 1 — Make it feel like a real game
- [ ] P1.1 Forgiving tool interactions with visible physical effects
- [ ] P1.2 Stop-hand signal + one breathing exercise as taught skills
- [ ] P1.3 Sound preview ("Hear the tool") and replay everywhere
- [ ] P1.4 Descriptive praise instead of generic "Great job"
- [ ] P1.5 Age modes 4–5 / 6–8
- [x] P1.6 Full Arabic RTL + recorded Arabic voice pass
- [ ] P1.7 Reduced-motion and quiet modes

## Priority 2 — Create the defensible product
- [ ] P2.1 Clinic-selected appointment pathways
- [ ] P2.2 Clinic photo/voice/branding customization
- [ ] P2.3 Adult-gated parent/dentist summary
- [ ] P2.4 Anonymous research mode (mood check, not diagnosis)
- [ ] P2.5 Validation with pediatric dentists and children
- [ ] P2.6 Outcome reporting separated from the child's reward experience

---

## Known defects found in the 2026-08-31 audit

Verified against `master` at `29473ab` and the live Railway build. None of these
are caught by the test suites, which are green (124 unit, 5 e2e).

- [ ] **D1 — The counting mission never runs.** `spray` is the "Quiet Counting
  Mission". `checkup.json` has no such module, and `ModuleHost.visibleModulesFor`
  filters it out of `treatment.json`, folding its star into `prepare` so the
  progress bar still adds up. The filter arrived in `b065dbe "Update Arabic
  narration flow"` and is not language-scoped, so it removed the mission from
  English too. This is the "practise calm skills" beat the external review asked
  for (P1.2), and the README still advertises it.
- [ ] **D2 — The brushing practice never runs.** No manifest routes to
  `practice-brush`, so `PracticeBrushScreen` ("Make the Tooth Sparkle") is
  unreachable. `60679e4 "one tooth screen, not two"` folded its behaviour into
  `PrepareScreen`, which is the *treatment* screen — so a child on the **first
  checkup** path is shown the sleepy juice. That is the exact first-visit /
  treatment mixing P0.1 and P0.2 are marked done for. Either re-point the
  checkup manifest, or delete the screen and its tests and correct the README.
- [ ] **D3 — Background music has never played.** `audio.startMusic()` fetches
  `/audio/music.mp3`; the file does not exist and never has in git history.
  Caddy's SPA fallback returns `index.html` as `text/html` with a 200, so the
  decode fails, `.play()` rejects, and the `catch` swallows it silently. Either
  add the track or remove the code and the ducking logic that serves it.
- [ ] **D4 — Arabic and English get different feedback when a spot is cleaned.**
  In `PrepareScreen`, Arabic plays a recorded sound effect once — on the first
  spot only, guarded by `decayRemovalSfxStarted` — and says nothing else.
  English says nothing but speaks a praise line after each spot. Since the
  fourth spot ends the step, `milo.praise.4` is baked in both languages and
  never heard. The synthesised `playEraseSfx` is not the counterpart: it is
  called only from the unreachable `PracticeBrushScreen`, and is itself gated on
  `lang === 'ar'`. Decide what cleaning a spot should sound like, once.
- [ ] **D5 — Six Arabic lines the game speaks are silent files.** 93 of the 126
  Arabic clips are byte-identical 5060-byte placeholders measuring −91 dB —
  digital silence. Most are for copy Arabic never speaks, so they only waste
  bandwidth, but six are on the live path: `lang.greet`, `milo.welcomeBack`,
  `milo.hint.tap`, `clinic.done`, `tools.done`, `visit.done`. An Arabic child
  gets no greeting when they choose the language, no help if they stall, and
  silence at the end of three of the four modules. Confirmed against the
  deployed build, not just locally. All six are listed as imported recordings in
  `Arabic-narration-used/manifest.json` with `runtimeDuration: 0.35` logged
  against them, so the import wrote the placeholder and recorded that it had.
  Check `Arabic-narration-redo/01-shared-milo-lines/` for usable source audio
  before re-booking the voice.

### Fixed in that audit
- The service worker precached 946 KB of Three.js and the `?stage3d=1` harness
  onto every device. The 3D chunks now build into `assets/3d/` and are excluded
  from the offline bundle, which drops from 11.14 MB to 10.19 MB. The game does
  not use 3D, and the harness's `.glb` models were never precached anyway.
- Deleted `app/src/components/ui/ToolCard.tsx` and `app/demo-artifact/`, both
  unreferenced. `oxlint` now reports no real findings, only fast-refresh notes.
- The README claimed a Facial Image Scale module that has never existed, named
  `ModuleFrame` (replaced by `GameStage`), and credited narration to ElevenLabs
  when English ships from `msedge-tts` and Arabic from human recordings.
- Deleted the `feat/game-stage` branch, fully merged into `master`.

### Where the evidence lives
`docs/narration-review/index.html` — every screen in both languages, each with
its screenshot, the narration it plays in order, the clip durations, and a
playable copy of every clip. Built by `app/scripts/build-narration-review.mjs`
from the screen components themselves; screenshots refreshed by
`app/scripts/capture-narration-review.mjs`. Open it from inside the repo so the
audio resolves. Lines are editable in the page and **Export edits** produces a
patch for `strings/*.json` plus the list of clips that would need regenerating.
