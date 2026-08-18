# Phase 0 — Repository inspection against the Website Delivery Blueprint

Prepared 16 August 2026, before any implementation. Branch `feat/game-stage`.

This is the report the blueprint's §22 Phase 0 and §26 require before editing. No
activity code has been changed.

---

## 1. Headline findings

Four things in the blueprint do not match the repository. Three of them change
what the work actually is, so they need a decision before Phase 1 locks content.

### 1.1 The Facial Image Scale does not exist

The blueprint treats it as existing and untouchable. It appears twice in the
journey (§4 steps 3 and 11, §14 Activity 2 and Activity 9), in the Definition of
Done ("scoring, storage and export remain unchanged"), and in the master
instruction's non-negotiable list ("Preserves the Facial Image Scale scoring,
storage and CSV export").

It is not in the codebase. Verified by search across `app/src`, `app/tests` and
`app/e2e` for *facial, anxiety, FIS, CSV, export, research, score, mood, face,
rating, survey, pre/post*:

- No screen. `registry.tsx` has exactly six module kinds: `clinic`, `tools`,
  `practice-brush`, `prepare`, `spray`, `visit`.
- No state. `store/game.ts` holds `lang`, `path`, `childName`, `stars`,
  `heroEarned`, `freePlay`. There is no anxiety field, no session id, no
  timestamps.
- No strings. The 111 string keys span `app lang ui parent milo clinic tools
  tool practice prepare spray visit reward cert friend story`. Nothing else.
- No CSV export, no persistence beyond the single `dental-adventure-v1`
  localStorage key.

The project's own docs assert the opposite. `docs/poc-review/MIGRATION_PLAN.md`
line 35 states "I proposed building the Facial Image Scale. **It already
exists.**", and `README.md` and `TECHNICAL-BRIEF.md` repeat it. That claim is
wrong, and the blueprint appears to have inherited it.

**Consequence:** this is net-new scope, not a preservation constraint. It is also
the only part of the product with research obligations — a pre/post instrument,
stable scoring, durable storage and an export path. "Restyle the shell only"
cannot apply to something that has no shell.

### 1.2 There is no router

The blueprint's §4 route map (`/language`, `/clinic`, `/tools`, …) has no
counterpart. `App.tsx` gates on booleans in sequence — `lang` → `path &&
parentDone` → `started` → `<ModuleHost />` — and `ModuleHost` then walks a JSON
manifest, picking the first module whose stars are not all earned.

The blueprint already hedges this ("Do not assume that the route names above
match the repository"), so this is a confirmation rather than a conflict: the
route names are conceptual. Progress resumption works by star state, not by URL.
The only URL input is `?visit=checkup|treatment` and the `?stage3d=` debug
harness.

### 1.3 The treatment path has no brushing step

Blueprint §5 treatment path: Clinic → Tools → **Brushing** → Prepare → Counting →
Visit.

Actual `content/paths/treatment.json`: `clinic` → `tools` → `prepare` → `spray`
→ `visit`. There is no `practice-brush` module in the treatment path.

The check-up path does match the blueprint (`clinic` → `tools` → `practice` →
`visit`), except that `tools` awards 2 stars there, which is how a 4-module path
reaches the 5 stars the Dental Hero badge requires.

Adding brushing to the treatment path is a one-line manifest change, but it
lengthens an already longer journey and changes the star maths. Needs a decision,
not an assumption.

### 1.4 The proposed tool grouping would undo a completed roadmap decision

Blueprint §14 Activity 5 proposes three fixed thematic groups of three
(Looking / Keeping Things Clean / Helping the Tooth), covering all nine tools.

`ToolsScreen` already groups automatically: it chunks the roster into balanced
pages of at most three. The roster comes from the manifest, so:

- Check-up shows **4** tools (mirror, suction, syringe, brush) → 2 + 2.
- Treatment shows **9** tools → 3 + 3 + 3.

The treatment case already produces the blueprint's shape. The check-up case does
not, deliberately: `docs/next-level-tracker.md` records **P0.6 — "Reduce
mandatory tool set to four (mirror, suction, air/water, polisher)"** as done.
Imposing nine tools on every child reverses that.

What is genuinely missing is *semantic* grouping — the groups are positional
chunks with no names or thematic meaning. That part of the blueprint is a real
addition and can be adopted without touching the roster sizes.

---

## 2. Current architecture

### Stack
React 19 + TypeScript + Vite + Tailwind v4 + Zustand + Motion, `vite-plugin-pwa`,
Vitest + Testing Library, Playwright. Matches the blueprint's §20 exactly. No
change needed.

### Shell
```
App.tsx
├─ .app-stage / .app-column      centred, capped play column
├─ Backdrop                      Blobs · Clouds · Sparkles · Waves
├─ HUD                           Milo (32px) · child name · ProgressStars
└─ ModuleHost                    manifest walker + star flights + story beats
   └─ GameStage                  world · caption · subject · action
```

`GameStage` already implements the blueprint's §6 layer model, minus a dedicated
effects layer (effects are currently drawn inside `subject` or as fixed overlays).
Its three fixed heights are a deliberate anti-jump measure and should survive.

### Viewport handling — already blueprint-compliant
`theme.css` uses `--app-h: 100dvh`, `env(safe-area-inset-top/bottom)`,
`overscroll-behavior: none` and `user-select: none`. Above a breakpoint it caps
to `min(100dvh - 3rem, 54rem)` inside a max-width column, which is exactly the
§7 "centred stage, not stretched across the monitor" requirement.

### Localization — already blueprint-compliant
`dirFor()` drives `document.documentElement.dir`/`lang`. Layout uses Tailwind
logical properties (`start-*`, `end-*`, `text-start`) rather than left/right, so
RTL mirrors structurally. No text is baked into artwork. Audio is keyed by string
id, not by visible text.

### Audio
`AudioController` singleton: `unlock()` on first `pointerdown`, `say()` pauses any
current clip before starting the next (overlap already prevented), `replayLast()`,
music ducking 0.25 → 0.08 during narration, and a talking-state subscription that
drives Milo's mouth. `AudioButton` is rendered by `GameStage` on every screen that
has an intro line.

Blueprint §9's audio requirements are therefore already met, with one exception:
unlock is bound to any first `pointerdown` on the window rather than specifically
to the language choice. Functionally equivalent, and arguably more robust.

### Copy freeze is real and exact
111 string keys × 2 languages = 222 mp3 files. Verified one-to-one: zero orphan
clips, zero keys without audio. Any wording change requires regenerating that
key's clip in both languages via `scripts/generate-audio-edge.mjs`.

### 3D subsystem
Already dormant and correctly isolated: `StageDemo` is lazily imported and only
renders when `?stage3d=` is present, so it never enters the shipping path or the
first download. The blueprint's §13 position ("may remain, keep it behind the
lazy boundary") is already the status quo — no work required.

One gap: the PWA `globPatterns` do not include `glb`, so the two models are not
precached. Harmless while 3D is off-path; would matter if it were ever promoted.

---

## 3. Meet the Clinic — what already exists

Against §26's requirement list, the existing `ClinicScreen` already delivers:

| §26 requirement | Status |
|---|---|
| Reuse existing GameStage | Done |
| Four interactive clinic objects | Done — chair, light, sink, table |
| Idle invitation animation | Done — `loops.breathe`, escalating to `loops.urge` |
| Idle hint after inactivity | Done — 10s, spoken `milo.hint.tap` |
| Narration per object | Done — `clinic.<id>.desc` |
| Localized name + short explanation | Done — in the zoom card |
| Focus overlay on the selected object | Done — `zoom-card`, dimmed backdrop |
| Completed state + progress star | Done — `DoneBadge`, star flies to HUD |
| Audio replay | Done — stage button, plus tap-to-replay on card art |
| Arabic RTL / English LTR | Done — logical properties throughout |
| No fail state | Done — no wrong-tap path exists |
| No text embedded in artwork | Done |
| Stranding guard | Done — `Next` can always finish a completed module |
| Unit + e2e coverage | Done — 3 unit tests, covered by 2 e2e journeys |

Genuine gaps against §26:

1. **Pointer Events.** Uses `onClick`. Works for touch and mouse today, but does
   not meet the literal `onPointerDown/Move/Up/Cancel` requirement and gives no
   drag or cancel semantics.
2. **In-scene Milo reaction.** Milo lives only in the HUD and reacts to the star
   count, not to individual object taps. §26 step 8 wants a per-object reaction.
3. **Object motion is generic.** Each object gets a small idle rotate/bob. The
   PowerPoint direction (five-beat chair teeter, light warm-up and flicker,
   delayed headrest) exists only in the 3D `Chair.tsx`, not in the 2D screen.
4. **The room is not the client's art.** `ClinicRoom` is two CSS radial
   gradients. There is no cleaned clinic background in play — `clinic-room.webp`
   exists but is referenced only by the 3D debug harness.
5. **Hit areas.** Each object is an `aspect-square` button, which is generous,
   but there is no explicit invisible collider larger than the visual, and no
   dev-mode hit-area visualization.

**Assessment:** Meet the Clinic is roughly 80% of the §26 spec already. The
remaining 20% is mostly blocked on art, not code.

---

## 4. Missing visual assets

These block a production-quality Meet the Clinic slice:

1. Cleaned clinic background with the interactive objects removed.
2. Dental light separated into arm and head (currently one flat image).
3. Chair headrest as a separate layer (for the 80ms delayed follow).
4. Isolated trolley / dental unit, if it is to be a fifth interactive object.
5. Light glow overlay as art rather than a CSS blur.
6. Floor invitation rings and completion sparkles as assets.

Existing and usable: `clinic-chair`, `clinic-light`, `clinic-sink`,
`clinic-table`, `drnour`, `drnour-masked`, `milo`, `milo-celebrate`,
`tooth-happy`, `tooth-sleepy`, `visit-child-chair`, all nine tools, plus
`moon.svg` / `star.svg`. All are flat single-layer WebP.

Asset-rule compliance to preserve: `art-in/README.md` documents the pipeline
(raw art in, `import-art.mjs` trims and downscales to `public/art`), and
`public/art/LICENSE.txt` exists. The blueprint's warning about watermarked
PowerPoint material (Alamy spray, VectorStock motion graphic) is noted — none of
that has entered `public/art`.

One naming note: `tool-syringe` is the **air/water** syringe, and its copy says
so ("The air feels cold, like a tiny wind on your tooth"). It is not an
injection. The blueprint's "no needles" rule is already satisfied; the asset name
should not be "fixed" by anyone reading it out of context.

---

## 5. Validation commands — actually run, actual results

| Command | Result |
|---|---|
| `npm run lint` (oxlint) | **Pass**, exit 0. 15 warnings, all `only-export-components` fast-refresh advisories plus 2 unused imports in `demo-artifact/`. No errors. |
| `npx tsc -b` | **Pass**, exit 0. |
| `npm run build` | **Pass**. PWA precached 265 entries / 10.7 MB. One chunk >500 kB warning. |
| `npx playwright test` | **Pass — 5/5** in 1.0m. Covers English check-up, Arabic RTL treatment, `?visit=` preset, full offline, and reload-resumption. |
| `npx vitest run` | **Flaky — fails.** 10 failures on one run, 7 on another; the failing set changes between runs. |
| `npx vitest run --no-file-parallelism` | **Pass — 72/72, 17/17 files.** |

**Diagnosis:** the unit suite is green. The failures are an artefact of parallel
file execution — timer- and animation-driven components losing races under CPU
contention. Confirmed by three observations: the failing set is non-deterministic
across runs, the same files pass in isolation, and the whole suite passes
serially. This is pre-existing and unrelated to anything in this session
(reproduced identically at `HEAD` before any change).

**Fix:** set `fileParallelism: false` in the vitest config, or add
`--no-file-parallelism` to a test script.

**Gap:** `package.json` has only `dev`, `build`, `lint`, `preview`. There is no
`test`, no `typecheck`, no `e2e` script, despite 17 unit test files and 5
Playwright specs. The blueprint's "run the relevant equivalents" instruction
currently has nothing to point at.

---

## 6. Risks

1. **Copy freeze vs. blueprint copy changes.** Phase 1 asks to approve Arabic and
   English scripts, tool names, explanations and certificate wording. Every edit
   costs a regenerated clip pair. Batch all copy decisions into one pass and
   regenerate once.
2. **Unresolved Arabic copy defect.** `TECHNICAL-BRIEF.md` records Arabic
   truncation in places and a grammatical-perspective mismatch between the two
   languages. This must be settled *before* the regeneration pass, or it will
   cost a second one.
3. **The FIS decision gates the journey shape.** Two of the blueprint's twelve
   steps are the assessment. Until §1.1 is resolved, the journey cannot be
   locked, which means Phase 1 cannot close.
4. **Docs assert things that are not true.** At least one specific false claim
   (FIS exists) has already propagated into the blueprint. The poc-review docs
   should be corrected, or they will keep seeding bad plans.
5. **No real-device measurement.** Every performance number on record is from a
   desktop browser. The blueprint's 60fps/30fps targets on low-end Android remain
   unverified, and `README.md` in poc-review already flags this as outstanding.
6. **Rive is still unauthored.** Milo is a layered SVG rig behind a
   `MiloHandle` interface, with all seven states working. The `.riv` file does not
   exist. Per-object Milo reactions (§3 gap 2) can be built against the existing
   interface without waiting for it.
7. **Adding a fifth clinic object** changes the check-up star maths, since `tools`
   currently carries 2 stars there to reach 5.

---

## 7. Unclear requirements

1. Does the Facial Image Scale need to be **built**? If so, the research
   requirements (scoring scale, storage shape, export format, whether a session
   id is collected) are undefined and are not derivable from the repository.
2. Should brushing be added to the treatment path (§1.3)?
3. Should the check-up tool roster grow from 4 to 9 to match the blueprint's
   three-group structure, reversing P0.6 (§1.4)?
4. Is the dental unit / trolley a **fifth** interactive clinic object, or a
   replacement for one of the existing four? §14 says "dental unit or trolley"
   and "dentist's table, screen or another approved clinic object" — the current
   four are chair, light, sink, table.
5. Which roadmap governs? There are now three: `docs/next-level-plan.md` (P0–P2,
   partially complete), `docs/poc-review/MIGRATION_PLAN.md` (phases 1–10,
   partially complete), and this blueprint. They overlap and in at least one place
   (§1.4) conflict.

---

## 8. Proposed implementation order

Phase 1 cannot close until questions 1–3 above are answered. Everything below is
sequenced to keep unblocked work moving regardless.

**Step 0 — unblock the tooling** (no product risk, do immediately)
- Add `test`, `test:e2e` and `typecheck` scripts to `package.json`.
- Set `fileParallelism: false` so the suite is honestly green in CI.

**Step 1 — correct the record**
- Fix the FIS claim in `docs/poc-review/`, so no further plan inherits it.

**Step 2 — Meet the Clinic slice, code-only portion** (unblocked by art)
- Migrate object interaction to Pointer Events with explicit invisible colliders.
- Add per-object Milo reactions through the existing `MiloHandle`.
- Port the PowerPoint motion beats — chair teeter, light warm-up and flicker,
  delayed headrest follow — into shared motion tokens in `motion/springs.ts`
  rather than inline per component.
- Extend `GameStage` with the dedicated effects layer.
- Extend the existing 3 unit tests to cover the new interaction model.

**Step 3 — Meet the Clinic slice, art-dependent portion** (blocked on §4)
- Swap the CSS-gradient room for the cleaned background.
- Split the light into arm and head; split the chair headrest.
- Replace CSS glow with the overlay asset.

**Step 4 — validate the slice** on a real low-end Android device before treating
it as the visual standard for everything after it. The blueprint is explicit that
the slice sets the bar for the whole asset library, so measuring it late is
expensive.

**Steps 5+ — remaining activities** in the blueprint's order (Tools → Brushing →
Prepare → Counting → Visit → Reward), each closed out fully before the next.

The Facial Image Scale, if confirmed, should be scheduled as its own slice with
its own requirements pass. It is the only piece with external validity
obligations, and folding it into a presentation-layer phase would be a mistake.

---

## 9. What has been delivered against §8

Steps 0, 1 and 2 are done. Steps 3 and 4 are blocked on the art in §4 and on a
real device.

**Step 0 — tooling.** `test`, `test:watch`, `test:e2e` and `typecheck` scripts
added to `package.json`. `fileParallelism: false` set in the vitest config, with
the reasoning recorded next to it. `npm test` is now 78/78 green and honest.

**Step 1 — the record corrected.** The FIS claim is retracted in
`MIGRATION_PLAN.md` (including the "already exists" correction line, the
already-built table, the Phase 9 line and the do-not-touch list), `README.md`,
`TECHNICAL-BRIEF.md` and `WALKTHROUGH.md`, each pointing at the verification.

**Step 2 — Meet the Clinic, code-only.**

- *Pointer Events.* Objects now activate on `pointerdown`/`pointerup` with a
  24px tap slop and `pointercancel` handling, so a finger dragged across the
  room no longer fires every object it crosses. Covered by three new tests plus
  a live drag check in the browser.
- *Colliders.* Each object carries an explicit collider 14% wider than its
  artwork, so the transparent margin around trimmed art stops eating taps.
- *Milo reacts per object.* New `game/Milo/bus.ts` — the same subscription shape
  the audio controller uses for lip-sync. A screen publishes, the HUD forwards
  to the live rig through the existing `MiloHandle`. Milo points when an object
  is touched and is pleased when it is met; the star celebration still wins.
- *The client's motion beats are now shared tokens.* `motion/springs.ts` carries
  the five-beat teeter, `TEETER_S`, the recline, the light warm-up with its
  60ms flicker, the weighted trolley pulse, `SECONDARY_LAG` and `JOINT_STAGGER`,
  taken from the `p:timing` table in `MOTION_SPEC.md` §1 rather than invented.
  The chair and light get their exact beats; the sink and table get the
  trolley's. The chair's recline is a spring on its own wrapper because the
  teeter is a keyframe table and one transform track cannot be both.
- *Effects layer.* `GameStage` takes an `effects` slot at z-index 8 — over the
  subject, under the caption, never tappable. The clinic uses it for the room
  warming when the light comes on, which is a room-scale effect and does not
  belong inside a tappable object.
- *Sequencing.* A tap plays the object's beat for 500ms before the card arrives,
  matching the PowerPoint's own speech-bubble fade, so the child sees the thing
  respond to their touch before any words appear. The card then replays the beat
  at a size they can see.

**Still blocked, unchanged:** the chair headrest cannot lag by `SECONDARY_LAG`
and the light's arm joints cannot stagger by `JOINT_STAGGER` until those assets
arrive as separate layers. The tokens are in place for when they do.

---

## 10. Incidental cleanup done this session

- Deleted `app/README.md` — the untouched Vite/React template boilerplate, no
  project content.
- Deleted `app/src/assets/` — `hero.png`, `react.svg`, `vite.svg`, Vite scaffold,
  zero inbound references.
- Cleared regenerable output: `app/dist`, `app/shots`, `app/test-results`,
  `.playwright-mcp`, `app/demo-artifact/dist*`.
- Stopped a stale `vite preview` process from 15 August that was holding port
  4517 and blocking the Playwright suite from starting.

Verified after: `tsc -b`, `npm run build`, `npm run lint` and the full Playwright
suite all pass. A module-by-module import check found no other dead files in
`src` — every module except the `main.tsx` entry point has an inbound import.

Deferred pending a decision, because they are source material rather than junk:
`images/` (25 MB of tracked raw art that `import-art.mjs` reads from a hard-coded
path), `art-in/models-raw/` (41 MB of raw generator exports),
`Dental Adventure POC Review.zip` (14.5 MB at the root, already extracted into
`docs/poc-review/`), `voice-auditions/`, and `app/demo-artifact/` (a tracked
standalone demo builder nothing in the app references).
