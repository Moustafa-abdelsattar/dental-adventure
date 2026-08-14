# Migration Plan — Dental Adventure

**Repo:** `Moustafa-abdelsattar/dental-adventure` · branch `master` · 45 commits
**Scope agreed:** full rewrite of the view layer. Logic, content and infrastructure survive.
**Read alongside:** `dental-adventure-interactive-game-approach.md` (already in the repo — it is the target architecture, and it is correct)

---

## 1. Corrected baseline

The repo is considerably further along than a "POC". Before planning anything, register what already exists, because three of my earlier assumptions were wrong.

### Already built — do not rebuild
| Capability | Where | Note |
|---|---|---|
| React 19 + Vite + Tailwind 4 | `app/` | Current and appropriate |
| Zustand state | `app/src/` | Matches the recommended stack |
| Motion (framer-motion successor) | `app/src/` | Already the UI animation layer |
| Bilingual AR/EN with full RTL | `app/src/content/` | Strings files drive narration |
| **Baked narration, one clip per string per language** | `app/public/audio/` | Generated via ElevenLabs, works offline |
| **Facial Image Scale research module** | `app/src/screens/` | Pre/post anxiety measurement |
| Stars → Dental Hero certificate | `app/src/screens/` | Reward loop complete |
| Visit-type branching (checkup / treatment) | `app/src/screens/` | Parent-facing gate |
| Unit tests | `vitest` | `npx vitest run` |
| Full play-throughs, EN **and** AR | `playwright` | `npx playwright test` |
| Screenshot sweep of every screen | `scripts/sweep.mjs` | Needs preview server on 4517 |
| Grid-alignment assertions | `scripts/measure-layout.mjs` | Asserts every screen shares one grid |
| Narration generation | `scripts/` | Needs `ELEVENLABS_API_KEY` in root `.env` |
| Art import | `scripts/` | Currently 2D |
| Deployment | Railway | Live and working |

### Corrections to my earlier documents
- `ASSET_PIPELINE.md` claimed there is no audio. **Wrong** — narration is complete and baked. That document's audio section has been rewritten.
- I proposed Zustand, ElevenLabs and Motion as additions. **All three are already in place.**
- I proposed building the Facial Image Scale. **It already exists.**

### The activity list is longer than the PPTX
Current flow: language → visit type → meet the clinic → meet the tools → practise brushing → prepare the tooth → counting mission → walk-through of the visit → certificate. The PPTX covers only the clinic, the tools, and practice. **The extra activities stay.** The PPTX raises the bar on presentation; it does not shrink the product.

---

## 2. Diagnosis

One sentence: **the app is content-complete and presentation-poor.**

Every screen shares `ModuleFrame` — a card shell. The repo's own approach doc names this as the thing to avoid: *"Avoid a screen full of cards. Let the environment itself become interactive."* The card frame is why it reads as a website with animations rather than a game, and it is the keystone of this migration.

Second cause: the art is 2D. Tool and character artwork is adapted from Microsoft Fluent 3D, which is stylistically fine but flat. Flat bitmaps cannot squash, deform, catch light, or be inspected from another angle. The client has now supplied ten bespoke 3D renders that supersede the Fluent set.

**So the migration is exactly two things:** replace `ModuleFrame` with a staged game shell, and replace flat art with real geometry. Everything else is preserved.

---

## 3. Two constraints that shape every decision

### 3.1 Copy changes are expensive now
Narration is baked per string per language. **Every string edit requires regenerating an audio clip.** This inverts the usual cost: text is now the most expensive thing to change in the repo.

Consequence: `COPY.md` contains draft Arabic for six tools and all five practice lines. Freeze that copy with the client **before** any narration regeneration. Do not let copy churn through the rewrite.

### 3.2 Two test suites will break, and both must be kept green
- **Playwright** drives full play-throughs in both languages. A view-layer rewrite breaks selectors. Preserve every `data-testid` through the rewrite, or update specs in the same commit — never leave the suite red across phases.
- **`scripts/measure-layout.mjs`** asserts every screen aligns to one grid. A full-bleed 3D stage will violate it. Decide deliberately: either the stage respects the existing grid, or the script gains a documented exemption for stage screens. Do not silently disable it.

---

## 4. Target architecture

Adopt the structure from your own approach doc (§17), extended to what already exists:

```
app/src/
  screens/            KEEP the files, REWRITE their bodies
  content/            KEEP untouched — strings drive narration
  store/              KEEP — Zustand slices
  components/
    ui/               NEW  GameButton, ToolCard, SpeechBubble, AudioButton, ProgressStars
    motion/           NEW  FadeIn, Pop, Floating, StarBurst
  motion/
    springs.ts        NEW  the single source of motion truth
  game/
    GameStage.tsx     NEW  replaces ModuleFrame
    HUD.tsx           NEW  persistent Milo + stars
    Milo/
      Milo.tsx        NEW
      milo.riv        NEW
  three/
    Stage.tsx         NEW  shared canvas, lighting rig, camera controller
    ClinicScene/      NEW
    ToothScene/       NEW
    Instruments/      NEW
  backgrounds/        NEW  SVG blobs and waves

app/public/
  audio/              KEEP untouched
  models/             NEW  GLB output
  rive/               NEW  milo.riv
```

Responsibility split, non-negotiable (approach doc §6): **WebGL owns world, models, lighting, camera, particles. React owns buttons, text, audio, menus, progress, accessibility, navigation.** No UI inside the canvas.

---

## 5. Migration map

> Filenames marked **[confirm]** are inferred from the repo README's description of `src/screens/` (one file per screen, all sharing `ModuleFrame`). Task 0 resolves them.

| Current | Action | Target |
|---|---|---|
| `app/src/screens/ModuleFrame.tsx` **[confirm]** | **Replace** — the keystone change | `game/GameStage.tsx` + `game/HUD.tsx` |
| `app/src/screens/*.tsx` (one per screen) | **Rewrite bodies**, keep filenames, routes and test IDs | Each hosts a stage instead of a card |
| `app/src/content/*` strings and manifests | **Do not touch** unless copy is being deliberately re-cut | — |
| `app/public/audio/**` | **Do not touch** | — |
| `images/` (Fluent 3D adaptations) | **Superseded** for the 9 tools, chair, light | `public/models/*.glb` |
| `art-prompts/` | **Update** — request separated parts on transparent backgrounds, never composed scenes | — |
| `scripts/` art import | **Extend** to fetch and validate GLB | — |
| `scripts/measure-layout.mjs` | **Amend** per §3.2 | — |
| `scripts/sweep.mjs` | **Extend** — wait for canvas first-frame before capture, else screenshots are blank | — |
| `docs/` | **Add** `MOTION_SPEC.md`, this plan, the frozen copy sheet | — |
| Milo (current form) | **Replace** with a Rive rig | `game/Milo/milo.riv` |
| — | **Create** | `motion/springs.ts`, `three/Stage.tsx`, `components/ui/*`, `components/motion/*` |

### Motion tokens
Use the springs already defined in your approach doc (§14) as the literal implementation — they are good values and they are yours:

```ts
export const springs = {
  soft:    { type: 'spring', stiffness: 180, damping: 20 },  // cards, modals
  playful: { type: 'spring', stiffness: 350, damping: 16 },  // rewards
  snappy:  { type: 'spring', stiffness: 500, damping: 28 },  // buttons, tool drag
};
```

Mapping: buttons → snappy · cards → soft · rewards → playful · modals → soft · tool drag → snappy · character → Rive · background → slow linear · camera → smooth eased.

Hold the 70 / 20 / 10 balance from §15: stable UI, responsive micro-animation, wow moments. The high-end feel comes from hierarchy, not volume.

---

## 6. Phases

Each phase ends green — tests passing, deployable.

### Task 0 — Enumerate (do this first, commit nothing)
```bash
cd app
find src -type f -name '*.ts*' | sort
grep -rn "ModuleFrame" src | sort
grep -rn "data-testid" src | wc -l
cat package.json
```
Produce a real file inventory and replace every **[confirm]** in §5. Confirm which screens exist, what `ModuleFrame` actually provides, and where test IDs live.

### Phase 1 — Motion foundation
Files: `motion/springs.ts`, `components/motion/*`, `components/ui/*`
Extract every ad-hoc Motion value in the current screens into the token file. Build the UI kit: GameButton with press-scale 0.96 and spring-back, SpeechBubble, AudioButton, ProgressStars, ToolCard.
**Gate:** existing screens use tokens; no visual regression in the sweep; tests green.

### Phase 2 — GameStage replaces ModuleFrame
Files: `game/GameStage.tsx`, `game/HUD.tsx`, every screen file
Full-bleed stage: layered background, floor, subject layer, HUD above. Persistent HUD with Milo and the star row — stars fly from their origin into the HUD (approach doc §13). Screen transitions: outgoing fades and scales to 0.96, incoming rises 24px, 60ms overlap.
**Gate:** every screen renders in the stage, no card shell anywhere, Playwright green in both languages.

### Phase 3 — Milo in Rive
Files: `game/Milo/Milo.tsx`, `public/rive/milo.riv`
Rig from separated vector layers per approach doc §Layer A: body, arms, eyes, eyebrows, mouth, cheeks, shadow. States: idle, blink, talk, wave, point, happy, celebrate. React triggers states only — `Milo.trigger('celebrate')`, `Milo.setTalking(true)`.
Wire `setTalking` to the existing narration playback so his mouth matches the baked audio.
**Gate:** Milo is alive on every screen and lip-syncs to existing clips.

### Phase 4 — Asset conversion
See `ASSET_PIPELINE.md`. Client renders → GLB via Meshy or Tripo, cleaned in Blender via `blender-mcp`.
**Origins are load-bearing:** chair at the base column, light at the ceiling mount, tools at the grip point. Wrong origins invalidate every rotation in the motion spec.
Rig only chair (3 bones), light (3 bones), hugger ring (2 bones).
**Gate:** every GLB loads, correct scale, correct pivot. Do not proceed on bad origins.

### Phase 5 — The 3D stage
Files: `three/Stage.tsx`
Shared canvas, one shadow-casting key light plus warm fill and baked AO, contact shadows on the floor, camera controller with 1.5% idle drift, push-in on focus, 2–3px shake on impact. Progressive scene preloading per approach doc §22.
**Gate:** an empty stage that already feels alive; frame budget holding on a real low-end Android.

### Phase 6 — Clinic scene
Files: `three/ClinicScene/*`, clinic screen
Chair, light, trolley as hotspots. Timings from `MOTION_SPEC.md` §1 — extracted from the PPTX XML. Amplify the teeter from the source ±2° to ±7°; keep the five-beat rhythm. Light switch-on ramps emissive and warms ambient 6500K → 4200K over 600ms with joint stagger.
Tap a hotspot → camera moves in → **React** info panel appears above the canvas, never inside it.
**Gate:** side by side with PPTX slides 2–4, the sequencing reads as the same intent.

### Phase 7 — Instruments
Files: `three/Instruments/*`, tools screen
One tool at a time, not nine at once (approach doc §9). Selected tool flies toward camera, others recede, background blurs, child can drag to rotate. Nine distinct signature animations from `MOTION_SPEC.md` §2.
**Gate:** the nine feel individually characterised, not nine copies of one animation.

### Phase 8 — Tooth practice
Files: `three/ToothScene/*`, practice and brushing screens
The strongest gameplay moment. Mirror travels a Catmull-Rom path with tangent-slaved rotation and 8° banking, 2000ms, `cubic-bezier(.5,0,.5,1)`. Drag-and-drop per approach doc §11: pick-up scale 1→1.12, target glow on approach, snap with squash, star burst. Wrong drop shakes gently — never a red failure state.
Polisher finishes with the barn-open reveal of the clean tooth, `clip-path: inset(0 50% 0 50%)` → `inset(0)`, 500ms.
**Gate:** the reveal lands as a payoff. If flat, the fault is the impact frame and the sound cue, not the curve.

### Phase 9 — Remaining screens
Counting mission (approach doc §12 — progress ring, scale-and-blur countdown), visit walk-through (§D first-person POV, camera as the child), reward screen, FIS screens restyled into the stage. **FIS logic untouched.**

### Phase 10 — Harden
Performance pass against the budget in `ASSET_PIPELINE.md`. `prefers-reduced-motion` variants. Offline verification — service worker must cache models as well as audio. Portrait phone and landscape tablet. Safety review against the infographic AVOID list: no needles, blood, extraction, scary imagery, harsh sounds. Confirm the no-fail-state and tap-nothing-still-progresses rules survive the rewrite.

---

## 7. Do not touch

- `app/public/audio/**` — regenerating costs API credits and risks pronunciation regressions.
- `app/src/content/*` strings — unless copy is being deliberately re-cut with the client, in which case regenerate narration in the same commit.
- Facial Image Scale scoring, storage and CSV export — restyle the shell only.
- The offline strategy.
- Visit-type branching logic.
- Railway deployment configuration.

---

## 8. Risks

| Risk | Mitigation |
|---|---|
| Image-to-3D output unusable on thin geometry (explorer hook, mirror stem, umbrella frame) | Triage after conversion; budget Blender rework. One broken model is more visible than ten good ones |
| Playwright suite rots across a long rewrite | Preserve test IDs; never merge a phase with a red suite |
| Grid assertion blocks the full-bleed stage | Decide in Phase 2, document the exemption |
| Bundle and memory blow the budget on low-end Android | Progressive loading per §22; cut post-processing first — bloom is most expensive, least essential |
| Copy churn triggers repeated narration regeneration | Freeze copy with the client before Phase 3 |
| Rive rig scope creep | Seven states only. Ship those, extend later |
| Sweep screenshots capture blank canvases | Extend `sweep.mjs` to await first frame before capture |

---

## 9. Sequencing rules

- **Task 0 before everything.** Do not plan against inferred filenames.
- **Phase 2 is the keystone.** Removing `ModuleFrame` is what changes the product's character. Everything after is amplification.
- **Phase 4 gates 6, 7, 8.** Bad origins mean redoing every animation.
- **Milo before the 3D scenes.** He appears on every screen; getting him right early sets the emotional register.
- **Cut post-processing first** if performance fails.
