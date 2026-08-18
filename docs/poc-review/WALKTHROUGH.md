# Dental Adventure — where the project stands

Written 16 August 2026. Branch `feat/game-stage`, 16 commits, not merged, not pushed.
Everything below was measured, not estimated.

---

## 1. What the project is

A bilingual Arabic/English offline mobile web game that helps children aged 4–8 feel
less afraid of the dentist. It is *specified* to include a Facial Image Scale module
measuring a child's anxiety before and after playing, so the effect can be evidenced
rather than claimed — but **that module has not been built**. Corrected 16 August 2026;
earlier revisions of this walkthrough stated it was already in the product. See
`MIGRATION_PLAN.md` §1.

It is live on Railway and it works. Nine activities, narration recorded for every line
in both languages, full right-to-left support, installable and playable with no network.

---

## 2. Where it stood before this session

Content-complete and presentation-poor. That was the external review's diagnosis and it
was correct.

Every activity screen sat inside the same white card. The review named this as the
problem — the repo's own design notes say *"avoid a screen full of cards; let the
environment itself become interactive"* — and the card frame was why the game read as a
website with animations rather than as a game.

Two things were also true that the review had wrong, and the audit corrected:

- The motion foundation already existed. The three spring values the plan asked us to
  create were already in the codebase, verbatim.
- Milo, the mascot, already existed as a layered vector rig with a blink loop and a mouth
  wired to the narration — but **nothing in the app ever put him on screen.**

---

## 3. What shipped

### The card is gone

Every module screen now plays on a stage: sky behind, a floor underfoot, the subject
standing on that floor, and the words floating over the top. The clinic's four objects
stand in a room instead of sitting in a box. The dental visit reads as a room the child
is inside.

The card's one good idea survived — the title, the action button and the subject keep
fixed heights, so nothing jumps between steps. Verified: all seven screens land on the
identical grid in both languages, with no overflow.

### Milo travels with the child

He rides in the top bar on every screen and cheers when a star is earned. His rig was
finished — eyebrows added as their own layer, all seven expressions, and a proper control
interface so an animated version can replace him later without changing anything that
calls him. His mouth already moves in time with the recorded narration.

Shipping him surfaced a bug that had been sitting dormant since he was built: he threw a
console error the first time he spoke on any screen. Fixed.

### Screens hand over properly

One screen sinks back and fades while the next rises into its place, overlapping by a
beat so the stage is never briefly empty.

### A 3D stage

One shared canvas for the whole game, with a proper lighting rig, soft shadows, and a
camera that never sits perfectly still, moves in when a child taps something, and shakes
a couple of pixels on impact.

Measured: **5 draw calls against a budget of 60, 60fps, and the renderer downloads
separately** so the opening screens are no slower than before. It also survived a
stress test at 800,000 triangles without dropping below 60fps.

### The chair

One model made it all the way through: the client's chair render → 3D → optimised →
standing in the game, teetering when tapped, with a ring of light inviting the tap, a
highlight when touched, and the recorded narration and description appearing beside it.

The teeter is a real damped spring rather than a canned clip. Measured in the browser:
**6.81° peak, beats at 50 / 219 / 384 / 550 / 701 ms.** The client's PowerPoint keys those
beats 200 ms apart. That rhythm was not authored — it falls out of the physics, which is
why tapping twice makes the swing build instead of restarting.

Two shareable pages were built so this can be shown without a dev machine:

- The chair, tappable, with a live plot of its motion
- The clinic scene, tappable, with the narration

---

## 4. What was tried and did not work

This is the part worth reading.

### Turning the client's renders into 3D models

The route was: send each render to an image-to-3D service, clean it up, load it in the
game. One conversion in, the picture is mixed.

**It works for single objects.** The chair render was one clean object on a transparent
background, and it converted well.

**It fails for scenes.** The clinic room render was sent through the same tool on the same
day with the same settings. What came back was not a room. The walls, window, cabinets,
posters and sign were gone entirely. What survived was the furniture — chair, stool, cart,
lamp and rug — fused into a single object, with the lamp reduced to a lump and the hoses
to strings.

That is not a quality setting that can be turned up. These tools reconstruct *an object*.
Given a photograph of a room they wrap a surface over the foreground and discard the room.

**It cannot be taken apart afterwards.** The obvious next thought is to split the fused
clinic back into its pieces. This was tested rather than assumed: the mesh contains
**334 separate fragments, and not one of them is an object.** The largest is a flat patch
of floor. The chair is scattered across dozens of fragments interleaved with its
neighbours. There is nothing in the file that knows where the chair ends and the rug
begins — which is why the chair in that model cannot be highlighted, cannot be tapped on
its own, and cannot move on its own.

### What that costs going forward

Fourteen models are needed. Each one is a generation, a download, an optimisation and an
inspection. Three of them — the chair, the lamp and the hugger ring — additionally need
their parts supplied separately, because something on each has to bend, and a single
welded mesh cannot bend. The tool may simply not produce those.

### The honest problem underneath

Every conversion is lossy. The converted chair looks **worse** than the chair render it
came from. We are spending real effort turning approved artwork into rougher versions of
itself, in order to gain abilities the product mostly does not use.

---

## 5. What is blocked, and on whom

| Blocked on | What it needs |
|---|---|
| The clinic room | The chair, lamp, stool and cart **erased out of** `clinic.png` in any image editor. Needed whichever direction the project takes. |
| The lamp and trolley models | Generated from `light.png` and `unit.png` — the single-object renders, which is the case that converts well. |
| Any narration change | The Arabic copy is truncated mid-sentence, and English speaks in the third person while Arabic speaks in the first. Both are client decisions. Audio is recorded per line, so text is now the most expensive thing in the project to change. |
| The mascot's animated rig | A person in the Rive editor, plus dedicated character art. Not urgent — the current rig works. |
| Confirming performance | A real low-end Android phone. Every number so far is from a desktop browser. |

---

## 6. The end goal, and the recommended way there

**The goal is not a 3D game.** It is a child who is less frightened of the dentist, and
evidence that it worked. The review raised the bar on presentation; presentation is not
the same thing as geometry.

Look at what the motion actually asks for. The teeter is a rotation. The pulse is a scale.
The fly-in is a translate. The lamp switching on is a fade and a colour wash. **Every one
of those is a transform on a picture** — which is exactly what the client's PowerPoint
already does. The storyboard being matched is itself layered 2D.

Of the nine activities, eight need only tap, highlight, rotate, scale and fade. The one
place real 3D earns its keep is letting a child turn a dental tool over in their hands
during the brushing practice — and that is a nice-to-have, not the thing that reduces
anxiety.

There is also a budget argument. The stated target is a cheap Android phone. Staying 2D
removes that risk entirely: fourteen images instead of fourteen models plus a renderer.

### Recommended plan

1. **Stop feeding the 3D pipeline.** Keep the 3D stage — it is built, tested, and costs
   nothing while nothing uses it.
2. **Build the screens in layered 2D from the client's own renders**, animated to the
   exact PowerPoint timings. No new assets. Art quality identical to what was approved.
3. **Revisit 3D once, later, for the tooth practice only**, and only if watching a child
   says it is wanted.
4. **Spend the freed effort on what actually lands**: the interaction sound effects, which
   the project's own notes call half of perceived polish and which need nothing from the
   client; the Arabic copy freeze; and the offline, reduced-motion and safety hardening
   pass.

### Immediate next step

Build the clinic screen in layered 2D and place it beside the 3D one. Half a day, nothing
needed from anyone. Then the direction gets chosen by comparing two working things rather
than by argument.

---

## 7. Running it

```bash
cd app
npm run dev                  # develop
npm run build                # production build
npx vitest run               # 72 unit tests
npx playwright test          # 5 full play-throughs, both languages, offline, resume
node scripts/sweep.mjs       # screenshot every screen (needs a preview server on 4517)
node scripts/measure-layout.mjs   # confirm every screen shares one grid
```

Convert a raw model:

```bash
node scripts/optimize-glb.mjs ../art-in/models-raw/<name>.glb public/models/<name>.glb --tris 15000 --tex 1024
node scripts/split-parts.mjs ../art-in/models-raw/<name>.glb    # can it be taken apart?
```

Inspect things in the browser:

- `?stage3d=chair` — the clinic with the real chair, tappable
- `?stage3d=clinic` — the fused clinic model as the scene
- `?stage3d=/models/<name>.glb` — any converted model, against the real lighting

Art goes in `art-in/source-art/` (images) and `art-in/models-raw/` (raw exports).
Raw exports are deliberately not version-controlled; the optimised results are.

---

## 8. Status

16 commits on `feat/game-stage`. Master untouched. Nothing pushed.
72 unit tests, 5 end-to-end play-throughs, lint and type-check all passing.
