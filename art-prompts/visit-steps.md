# The visit walkthrough — four step frames

**Reference:** `art-prompts/ref/visit-strip.png` — the client's storyboard,
"DENTAL VISIT SIMULATION – STEPS".

## Why this is the gap

The storyboard draws **four different pictures**. The game ships **one**.

`visit-child-chair.webp` is a single static render, and all four narrated steps
play over it. Step 3 pastes a mirror on top and step 4 adds three sparkles;
steps 1 and 2 change nothing on screen at all. The child hears four things
happen and watches one thing sit still — which is why the climax of the game
reads as a caption slideshow rather than a walkthrough.

Four frames fixes that, and it is the whole fix. No new code beyond swapping
which image is drawn.

## The rule that makes it smooth

**One render, varied four times. Never four separate generations.**

Same child, same chair, same pose, same camera height, same distance, same crop,
same light direction — so that only the thing the step is about changes between
frames. Get that right and the game can cross-dissolve one into the next and it
looks like a camera watching a room. Get it wrong — child a little bigger, chair
a little rotated — and every transition is a visible jump-cut that no amount of
animation timing will hide.

Practically: generate frame 1, then produce 2, 3 and 4 as **image-to-image edits
of frame 1 at low denoise**, or inpaint only the region that changes. Do not
re-roll the base.

Attach **`app/public/art/visit-child-chair.webp`** as the style and identity
reference on every frame — it locks the child, the chair and the clay-render
look to what is already on screen. Attach `app/public/art/clinic-room.webp` too
for palette and light direction.

## Output

Cut out on **transparent background**, no room behind them — the room is a
separate layer the screen already draws. Same canvas size and same subject
placement within that canvas for all four, so they stack pixel-aligned.

| # | File | Narration it plays under |
|---|------|--------------------------|
| 1 | `app/public/art/visit-step-chair.webp` | "Sit in the chair" |
| 2 | `app/public/art/visit-step-light.webp` | "Turn on the light" |
| 3 | `app/public/art/visit-step-mirror.webp` | "Dentist checks with mirror" |
| 4 | `app/public/art/visit-step-clean.webp` | "Teeth cleaning" |

Plus one more the storyboard implies but does not draw — see frame 5 below.

---

## Frame 1 — Sit in the chair

The base render. Everything else is an edit of this one.

> A cheerful young boy reclining comfortably in a blue children's dental chair,
> soft 3D clay-render style: rounded matte forms, plush and toy-like, gentle rim
> lighting, soft contact shadows. Match the child, the chair, the style, the
> palette and the camera of the attached reference exactly.
>
> He is settled back against the headrest, relaxed, hands resting in his lap, a
> pale blue paper bib clipped at his chest. Calm and comfortable, a small easy
> smile, mouth closed. No tools anywhere in frame. No dentist in frame.
>
> Three-quarter view from slightly above, single soft key light from the upper
> left. Transparent background.

**Negative:** no text, no letters, no numbers, no labels, no watermarks. No
needles, no blood, no drills, no open surgical mouths, nothing sharp, nothing
that reads as adult medical equipment. No fear, no crying, no distress.

## Frame 2 — Turn on the light

Edit of frame 1. **Only the lighting changes.** The child does not move.

> Identical to the reference image in every way — same child, same pose, same
> chair, same crop. The only change: a warm butter-yellow pool of light now
> falls on him from above, brightest across his chest and face, softening to
> nothing at the edges. Warm highlights on the chair's blue upholstery where the
> light lands. He looks up toward the light, pleased and curious, still relaxed.

**Note for the build:** the lamp itself and its glow cone are already drawn by
the screen as separate layers, so this frame supplies only how the child *looks*
when lit. Do not paint the lamp into this frame.

## Frame 3 — Dentist checks with mirror

Edit of frame 1. The child's head turns slightly and his mouth opens; Dr. Nour
enters frame.

> Identical child, chair, pose, crop and lighting as the reference. Changes: the
> boy's mouth is open in a comfortable, unforced "aah" — relaxed, not a grimace,
> no teeth clenched, no distress. A friendly woman dentist in a pink hijab and
> blue scrubs leans in from the right of frame, holding a small round dental
> mirror with a pale blue handle gently near his mouth, not touching. She is
> smiling warmly and watching his face, not the tool.

Keep her the same character as `app/public/art/drnour.webp` — attach it as a
second reference.

**Negative:** as frame 1, plus — the mirror must not enter the mouth, and no
hand may cover the child's face.

## Frame 4 — Teeth cleaning

Edit of frame 3. Same two characters, same staging; the tool and the mood change.

> Identical to the reference image — same child, same chair, same dentist, same
> position and crop. Changes: she now holds a small polishing handpiece with a
> soft round rubber cup on the end, gently at his front teeth. His teeth are
> visibly bright and clean, with a few small four-point sparkle glints around
> his mouth. He looks delighted — a wide happy smile around the tool, eyes
> bright. She is smiling.

**Negative:** as frame 1, plus — no spray, no water jet, no foam, no mess. The
handpiece must read as soft and toy-like, never as a drill.

## Frame 5 — Raise your hand (the stop signal)

Not in the storyboard strip, but the game teaches it before the four steps and
currently illustrates it with a flat drawn hand on a yellow button. It is the
one moment that hands the child control, and it deserves the same treatment.

Edit of frame 1.

> Identical child, chair, crop and lighting as the reference. The only change:
> he has lifted one hand clearly into the air beside his head, palm open and
> forward, fingers spread — the universal "stop, I need a moment" signal. He is
> calm and confident, looking at the viewer with a reassuring smile. Not
> distressed, not waving hello — a deliberate, comfortable raised hand.

**Output:** `app/public/art/visit-step-hand.webp`

---

## Checking them before they go in

Stack all five in any editor as layers and flick between them. If anything other
than the intended change moves — the chair shifts, the child grows, the crop
drifts, the light direction flips — the frame is wrong and needs redoing as an
edit of frame 1 rather than a fresh generation. That flick test is the whole
quality bar; if it passes, the cross-dissolve in the game will look right.
