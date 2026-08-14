# Dental Adventure — Requirements

Documentation for rebuilding the presentation layer of `Moustafa-abdelsattar/dental-adventure` to the visual and motion standard set by the client's PPTX storyboard.

Prepared 14 August 2026.

---

## Status

| Phase | State |
|---|---|
| Task 0 — Enumerate | Done. Findings below. |
| 1 — Motion foundation | Done — `feat/game-stage` |
| 2 — GameStage replaces ModuleFrame | Done — `feat/game-stage` |
| 3 — Milo in Rive | Done in SVG — `feat/game-stage`. All seven states, separated layers including eyebrows, and the `trigger`/`setTalking` interface, with lip-sync wired to the baked clips. **The `.riv` file itself still needs authoring in the Rive editor**; it swaps in behind the same interface without callers changing |
| 4 — Asset conversion | **Blocked** — needs a Meshy or Tripo API key and `blender-mcp`. Gates 6, 7, 8 |
| 5 — The 3D stage | Done — `feat/game-stage`. Harness at `?stage3d=1`. Measured 5 draw calls / 1.5k triangles / 60fps in a desktop browser; **the real low-end Android check is still outstanding** |
| 9, 10 | Not started |

### Corrections found during Task 0
The baseline in `MIGRATION_PLAN.md` §1 was out of date in both directions. Read it with these:

- **Phase 1 was already largely built.** `app/src/lib/springs.ts` already held the three spring tokens verbatim, and `components/motion/` and `components/ui/` already held the UI kit. Phase 1 became an extraction of the eight remaining inline `stiffness`/`damping` literals, not a build.
- **Milo already existed as a layered SVG rig** — blink loop, talking mouth already wired to narration playback, and five of the seven states, though nothing in the app actually mounted him. Phase 3 was a port plus two states, not a build from nothing; it is now done in SVG at `app/src/game/Milo/Milo.tsx` and awaits only the `.riv` authoring.
- **Narration was generated with `msedge-tts`**, not ElevenLabs as `ASSET_PIPELINE.md` §4 states. `scripts/generate-audio-edge.mjs` is the live pipeline. The ElevenLabs key in the root `.env` does work and remains the route for the missing SFX.
- **The grid assertion did not block the full-bleed stage.** §3.2 anticipated a conflict; `app/scripts/measure-layout.mjs` reports all seven screens still landing on one grid in both languages after the rewrite, so no exemption was needed.

The two open items in the last section of this file are unchanged and still block narration work.

---

## Read in this order

### 1. `MIGRATION_PLAN.md` — **start here**
The plan for the existing repo. Corrected baseline of what is already built, the two-line diagnosis, the file-by-file migration map, ten phases with gates, what must not be touched, and a risk register.

Key finding: the app is content-complete and presentation-poor. Narration, RTL, the Facial Image Scale, Zustand, Motion and two test suites already exist. The migration is two things — replace the `ModuleFrame` card shell with a staged game shell, and replace flat art with real geometry.

### 2. `MOTION_SPEC.md`
Every animation in the product. Sections 1–3 are extracted from the `p:timing` XML of `tooth game.pptx`, so the timings are the client's literal intent rather than an interpretation:

- Chair teeter: ±2° across five beats, 1000ms total
- Light teeter: same shape at 1800ms, starting 500ms after the caption
- Trolley pulse: scale 1 → 1.14 → 1 over 2000ms
- Clinic reveal: fly in from left, 500ms
- Mirror motion path: 2000ms at 50% accel / 50% decel
- Sleepy spray: fly in from right 500ms, puff at +500ms
- Polisher chain: fade in → mist → barn-open reveal of the clean tooth

Also carries the nine motion principles, spring configs, idle loops, camera language, and reduced-motion behaviour.

### 3. `ASSET_PIPELINE.md`
PNG → GLB conversion route, which models will fail and why, Blender cleanup and rigging via `blender-mcp`, pivot origins (load-bearing — wrong origins invalidate every rotation in the motion spec), the audio situation, and the mobile performance budget.

### 4. `COPY.md`
All bilingual strings. **Client-verbatim Arabic is marked `[CLIENT]` and must not be rewritten.** My drafts are marked `[DRAFT]` and need review — note that narration is baked per string, so every approved draft carries an audio regeneration cost.

---

## Source art — `art-in/source-art/`
Sixteen prepared PNGs: background-knocked-out, alpha-trimmed, semantically named. Ten are the client's bespoke 3D renders; five were extracted from the PPTX; `milo.png` is a placeholder cropped from another asset and needs dedicated character art.

These are the inputs to Phase 4 of the migration plan.

---

## Two open items blocking work

1. **Arabic copy is incomplete.** The client's message truncated at `الـAir-`. Three lines are complete and verbatim (chair, light, suction); the rest is draft. Freeze this with the client before regenerating narration.
2. **English voice is inconsistent with Arabic.** English uses the infographic's third-person wording ("This tiny mirror helps…"); the Arabic is first-person ("أنا المراية الصغيرة!"). Confirm which voice wins.
