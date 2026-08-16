# Dental Adventure — technical brief for external review

**Purpose of this document:** to be handed to a reviewer who has no access to the
repository, so they can judge one specific decision. The decision is stated in §9.
Everything before it is the evidence needed to judge it.

Written 16 August 2026. All figures are measured, not estimated; the measurement
method is given wherever a number appears.

---

## 1. The product

A web game that helps children aged 4–8 be less afraid of going to the dentist.

- **Audience:** children 4–8, most of whom cannot read. Narration carries the content.
- **Languages:** Arabic and English, with full right-to-left layout, not just translated
  strings.
- **Deployment:** installable PWA, must work with no network at all. Live on Railway.
- **Devices:** phones. The stated floor is a low-end Android.
- **Clinical angle:** includes a Facial Image Scale module that records a child's
  self-reported anxiety before and after play, so effectiveness can be evidenced. Its
  scoring, storage and CSV export are explicitly out of scope for any redesign.

### The nine activities

1. Language choice
2. Parent gate — visit type (check-up or treatment), child's name
3. Welcome
4. Meet the clinic — tap four objects, hear what each is for
5. Meet the tools — meet nine dental instruments, in groups
6. Practice brushing — clean sticky spots off a large tooth with a brush
7. Prepare the tooth — a guided three-tool sequence (treatment path only)
8. Counting mission — a calm count to ten
9. Walk-through of a visit, then a Dental Hero certificate

Design rules that are non-negotiable in the existing product: no fail states, tapping
nothing still progresses, no needles/blood/extraction imagery, no harsh sounds, no
drill noise anywhere.

---

## 2. Stack

```
React 19.2 · TypeScript 6.0 · Vite 8.2 · Tailwind 4.3
Zustand 5.0 (state) · Motion 13.1 (animation) · vite-plugin-pwa 1.3 (offline)
three 0.185 · @react-three/fiber 9.7 · @react-three/drei 10.7   (added this session)
Vitest 4.1 (72 unit tests) · Playwright 1.62 (5 end-to-end)
@gltf-transform/cli 4.4 + meshoptimizer (asset pipeline, added this session)
```

~4,200 lines of TypeScript in `src`. Narration is 222 pre-generated mp3 files, one per
string per language, produced with `msedge-tts` and committed, so playback is identical
on every device and works offline.

**Consequence that shapes everything:** because narration is baked per string, changing
one line of copy requires regenerating an audio clip. Text is the most expensive thing
in this project to change.

---

## 3. The brief we are working to

A client-supplied PowerPoint acts as the storyboard. Animation timings were extracted
from its `p:timing` XML, so they are the client's literal intent rather than an
interpretation. An external review then turned this into a ten-phase migration plan.

The review's diagnosis: **content-complete and presentation-poor.** Every activity screen
sat inside the same white card. The repo's own design notes already said *"avoid a screen
full of cards; let the environment itself become interactive."*

The review's two prescriptions:

1. Replace the card shell with a staged game shell.
2. **Replace flat art with real geometry** — on the argument that *"flat bitmaps cannot
   squash, deform, catch light, or be inspected from another angle."*

Prescription 1 is the subject of §5. **Prescription 2 is what §9 asks the reviewer to
judge.**

### The motion the PowerPoint actually specifies

Extracted from the XML, then amplified where the source was too subtle for a phone:

| Element | Source | As specified for the rebuild |
|---|---|---|
| Chair | 5 keyframes, 200 ms apart, ±2° rotation, 1000 ms total | Same 5-beat rhythm, amplified to ±7°, driven by a spring rather than keyframes |
| Chair, then | — | Reclines 14° about its hinge; headrest lags 80 ms |
| Lamp | Same 5-beat shape at 1800 ms total | Same, plus emissive 0→1 over 400 ms with a 60 ms flicker at 120 ms; ambient warms 6500K→4200K over 600 ms; arm joints stagger 90 ms, distal last |
| Trolley | Grow/shrink preset, 2000 ms, click-triggered | Scale 1 → 1.14 → 1 |
| Mirror | Motion path, 2000 ms, 50% accel / 50% decel | Catmull-Rom path, tangent-slaved rotation, 8° banking |
| Polisher | — | Fade in → mist → barn-door reveal of the clean tooth, `clip-path: inset(0 50% 0 50%)` → `inset(0)`, 500 ms |

### The performance budget

```
Draw calls        < 60 per frame
Triangles         < 120,000 on screen
Texture memory    < 48 MB
Frame rate        60fps target on mid-range Android, 30fps floor
Initial bundle    < 2.5 MB, models lazy-loaded per act
```

Stated tactics: cap device pixel ratio at 2, one shadow-casting light plus baked ambient
occlusion, and **cut post-processing first** if the budget fails.

---

## 4. Method note

Every claim below was verified in a real browser via Playwright, by reading values out of
the running application rather than by inspection. Where a number is quoted, the
measurement is described. Two corrections were made to my own measurements during the
session and are noted, because they affect how much weight the numbers carry.

---

## 5. What shipped, and what it cost

### 5.1 The card shell was replaced (the review's prescription 1)

A `GameStage` component in four layers — world, caption, subject, action — replaced the
card. Screens now read as rooms rather than boxes.

**Verified:** all seven module screens place their title at y=64, their sub-line at y=104
and their action button at y=756 on a 390×844 viewport, in **both** English and Arabic,
with `scrollWidth == viewportWidth` (no overflow). Measured by a script that walks each
screen and reads bounding boxes.

The review anticipated that a full-bleed stage would break the project's existing
grid-alignment assertion and advised documenting an exemption. **It did not break it.**
No exemption was needed.

**Effort:** roughly an afternoon. **New assets required: none.**

### 5.2 Motion tokens

The review asked for a single source of motion truth. It already existed — the three
spring configurations it specified were in the codebase verbatim. The work was extracting
eight remaining hard-coded values, not building a system.

### 5.3 The mascot

A layered vector mascot with a blink loop and a mouth already wired to narration playback
existed in the repo — **and was never mounted anywhere in the running app.** It was
finished (eyebrows added as a separate layer, seven states, an imperative
`trigger()`/`setTalking()` interface so an animated rig can replace it behind the same
calls) and put in the persistent top bar.

Shipping it surfaced a latent bug: an SVG ellipse animated without an initial value wrote
`undefined` to `rx`/`ry` on its first render pass, throwing a console error the first time
the mascot spoke on any screen. Fixed by supplying an explicit initial.

### 5.4 The 3D stage

One shared canvas for the whole game. One shadow-casting key light plus hemisphere fill,
contact shadows, colour temperature as an animatable parameter, and a camera with 1.5%
idle drift, push-in on focus, and an impact shake. No post-processing — the budget names
it as the first thing to cut, so it was never added.

**Verified in browser:**

- 5 draw calls, ~1,500 triangles, **60.2 fps** on an empty stage
- Camera drift is real motion, not a no-op: 0.11 world units of lateral travel sampled off
  the camera object
- Push-in travels 3.24 world units
- Impact shake computes to **2.3 px** at the working distance — the spec asks for 2–3 px
- Renderer is an 866 KB lazy chunk; **initial bundle stays at 389 KB** against a 2.5 MB
  budget
- Stress test: **60.2 fps at 800,048 rendered triangles**, ~7× the on-screen budget

**Correction worth recording:** my first attempt to prove the camera drifts compared
canvas pixels between frames and returned zero. That was a broken test, not broken code —
reading a WebGL canvas without `preserveDrawingBuffer` returns a cleared buffer. I
re-measured off the camera object itself.

### 5.5 The asset pipeline

A Node script (`gltf-transform` + `meshoptimizer`) replaces what the review assumed would
be manual Blender work: weld, simplify, drop unused texture channels, resize, make
single-sided, compress. Meshopt rather than Draco deliberately, because Draco's decoder is
normally fetched from a CDN at runtime and this application must work offline.

Two things the review treated as requiring a modelling tool were solved in code instead:

- **Pivot origins.** The review calls wrong origins fatal — *"wrong origins invalidate
  every rotation in the motion spec."* Image-to-3D services centre the origin on the
  bounding box. Rather than re-authoring each model, the loader wraps the mesh in a group
  and offsets it, so the pivot can be placed anywhere at runtime and changed in one line.
- **Rigging.** Avoided by requesting separated parts instead of skinned bones — the
  review's own §3 recommends this.

**Measured on the one model that succeeded:**

```
375,848 triangles          →  24,579
3 × 2048² textures         →  1 × 1024² webp
~67 MB texture memory      →  ~5.6 MB
17.1 MB file               →  0.33 MB
double-sided               →  single-sided
```

### 5.6 The chair, working end to end

Tap it and: a ring of light on the floor invites the tap beforehand and pulses harder
after ten idle seconds; touching lifts the model's emissive; the camera travels to it; the
recorded narration plays; the name and description appear in HTML above the canvas; and it
teeters.

The teeter is an actual damped harmonic oscillator, integrated at a fixed sub-step, not a
canned clip.

**Verified in browser: 6.81° peak, turning points at 50 / 219 / 384 / 550 / 701 ms,
settling to exact rest.** The PowerPoint keys its five beats 200 ms apart. That cadence
was not authored — it emerges from the client's own stiffness and damping values.

**A correction that mattered:** deriving the impulse naively as `peak × ω` produced 5.24°,
not 7°, because damping bleeds off roughly a fifth of the first swing. Solving the damped
response properly — impulse = `peak ÷ [e^(−ζω·φ/ω_d)·sin(φ)/ω_d]` where
`φ = atan(√(1−ζ²)/ζ)` — gives the specified amplitude. There is a unit test asserting it.

Two design decisions worth flagging for review:

- **Taps go through an invisible box collider, not the mesh.** A four-year-old's aim is
  imprecise, so the target should be generous; and hit-testing 12 triangles per pointer
  move beats hit-testing 24,000.
- **Highlighting is done by lifting the material's own emissive, not an outline pass.**
  Outlines require post-processing, which the budget cuts first.

---

## 6. What failed, and the diagnosis

### 6.1 Single objects convert acceptably; scenes do not

The chair render — one object, transparent background — converted usably.

The clinic room render was sent through the same service, on the same day, roughly seventy
minutes apart, at the same settings. **The room did not survive.** No walls, no window, no
cabinets, no posters, no signage. What came back was the furniture — chair, stool,
delivery cart, overhead lamp and rug — fused into a single object, with the lamp reduced
to a shapeless lump, the stool's legs smeared, and the cart's hoses reduced to strings.
The source render's baked shadows also came through in the texture, where they fight the
application's own lighting.

**This is not a quality setting.** Image-to-3D reconstructs *an object*. Given a
photograph of an interior it wraps a surface over the foreground and discards the room.
The project's own asset notes predicted it: *"request separated parts on transparent
backgrounds rather than one composed image."*

**Ruling out generator version as the cause.** The failure was not "we used the cheaper
model." Chair and room came from the same tool on the same day. Further, the room was
re-optimised at **400,000 triangles — thirteen times the polygon budget** — to separate
the tool's failure from my own decimation. The result was sharper and **every structural
defect survived**: still no walls, still fused, lamp still a lump.

### 6.2 The fused model cannot be taken apart

The obvious remedy is to split the fused clinic back into its objects. This was tested,
not assumed, with a purpose-written tool that walks the index buffer and groups triangles
sharing vertices.

**Result: 588,387 triangles across 334 connected fragments, none of which corresponds to
an object.** The largest fragment is 4.9% of the mesh and is a flat patch of *floor*. The
next several are also floor slabs. The chair is scattered across dozens of fragments
interleaved with its neighbours.

There is therefore nothing in the file that knows where the chair ends and the rug begins.
This is the precise, mechanical reason that in this model the chair **cannot be
highlighted, cannot be given its own tap target cleanly, and cannot move independently.**

For completeness: tapping, narration and text would all still work against it — an
invisible collider can be placed over the chair's region, and words and audio are HTML.
**Only the highlight and the independent motion are impossible.** Highlighting is a
material property, and the model has exactly one material, so brightening the chair
brightens the stool, cart, lamp and rug simultaneously.

A spatial carve — take every triangle inside a box — would technically work and would look
poor: ragged edges where the box slices through neighbouring hoses, and holes where the
chair meets the rug, because a reconstruction shell has no back surface where objects
touch.

### 6.3 The cost of continuing

Fourteen models are required. Each is a generation, a paywalled download, an optimisation
and an inspection. Three of them — chair, lamp and hugger ring — additionally require
their parts supplied *separately*, because something on each must bend and a single welded
mesh cannot bend. The tool may not be able to produce those at all.

### 6.4 The finding that reframes the decision

**Every conversion is lossy, and the converted chair looks worse than the render it came
from.** The client's artwork is high quality; the conversions are visibly rougher. Effort
is being spent turning approved art into degraded versions of itself.

---

## 7. Current blockers

| Blocked item | Needs | From whom |
|---|---|---|
| Clinic room backdrop | The chair, lamp, stool and cart **erased out of** the room render, in any image editor. Required regardless of direction. | Client / designer |
| Lamp and trolley models | Generation from the two single-object renders (the case that converts well) | Client |
| Any copy change | Arabic text truncates mid-sentence; English narrates in third person while Arabic narrates in first person. Audio is baked per line. | Client decision |
| Animated mascot rig | A human in the Rive editor, plus dedicated character art. Not urgent. | Designer |
| Performance sign-off | A real low-end Android handset. **Every number in §5 is from a desktop browser at device pixel ratio 1.** | Team |

---

## 8. The alternative under consideration

Do the presentation work in **layered 2D** — the client's own renders, composited and
animated with transforms — instead of converting them to geometry.

**The argument for it:**

- The PowerPoint being matched *is itself layered 2D with transforms.* `animRot
  by="120000"` is a flat picture rotated two degrees. To match the storyboard exactly, 2D
  is arguably the more faithful medium, not the compromise.
- Read the motion spec as operations: teeter = rotation, pulse = scale, fly-in =
  translate, lamp switch-on = opacity plus a colour wash, polisher reveal = a `clip-path`
  animation the spec *already writes in CSS*. All are transforms on a bitmap.
- The required layers already exist as clean transparent-background renders.
- Art fidelity becomes exactly what the client approved, with zero conversion loss.
- It eliminates the one budget risk that has never been closed: the low-end Android
  target. Fourteen images instead of fourteen models plus an 866 KB renderer.
- Of the nine activities, eight require only tap, highlight, rotate, scale and fade.

**The argument against it:**

- Genuine depth, a camera that truly travels into a room, and lighting that responds to
  geometry are lost. Push-in becomes a scale; the lamp's warm-up becomes an overlay.
  Convincing, but faked.
- Free inspection — a child turning a dental instrument over in their hands — is not
  possible. The design notes call for this explicitly in the tools activity.
- Per-object squash and stretch is limited to non-uniform scale rather than true
  deformation. The review names deformability as a core reason to go 3D.
- It partially contradicts a paid external review, which is a governance question as much
  as a technical one.

**The proposed middle position:** keep the 3D stage (built, tested, lazy-loaded, costs
nothing while unused); build the screens in 2D; revisit 3D later for the tooth-brushing
activity alone, where free rotation of an instrument may genuinely help — and where the
assets are single objects on transparent backgrounds, the case that converts well.

---

## 9. The question for the reviewer

> An external review prescribed converting a children's game's approved 2D artwork into 3D
> geometry, on the grounds that bitmaps cannot squash, deform or catch light. One of
> fourteen models has converted successfully and looks worse than its source render. Scene
> conversion has failed outright and been shown to be unfixable. The animation the client
> actually specified consists entirely of rotation, scale, translation, fades and a
> `clip-path` reveal.
>
> **Should the project continue converting to 3D, switch to layered 2D with transforms, or
> take the hybrid position of 2D everywhere except one activity?**

Considerations we would like weighed, and challenged where we have reasoned badly:

1. Are we correct that the specified motion is fully achievable with 2D transforms, or is
   there something in the spec we have misread?
2. Is "the storyboard is itself 2D, therefore 2D is the faithful medium" sound reasoning,
   or a rationalisation of an asset problem?
3. How much does losing free 3D inspection of the instruments actually cost, for a
   four-to-eight-year-old audience?
4. Is there a route to usable per-object 3D assets we have not considered? We have ruled
   out: better generator versions (tested), higher polygon budgets (tested), post-hoc mesh
   splitting (tested), and manual modelling (no 3D artist available).
5. Does the fact that a paid review prescribed the 3D route change what we should do, on
   evidence that has emerged since it was written?

---

## 10. Status

17 commits on branch `feat/game-stage`. Master untouched. Nothing pushed or deployed.
72 unit tests, 5 end-to-end play-throughs covering both languages, offline behaviour and
progress resumption. Lint and type-check clean.

Nothing described here is difficult to unwind. The 3D subsystem is nine files behind a
lazy boundary and is not referenced by any shipping screen.
