# Visit walkthrough — copy-paste prompts for ChatGPT

## Before you start — three rules

1. **Attach `visit-child-chair.webp` to every single prompt.** That is the boy
   and the chair already in the game. Without it you get a different child in
   every frame.
2. **Always attach the ORIGINAL, never the frame you just made.** Chaining edits
   (frame 2 → frame 3 → frame 4) compounds drift, and by frame 4 it is a
   different boy. Every frame is an edit of frame 1.
3. **Ask for a plain flat white background, not transparent.** ChatGPT will not
   give you a clean alpha channel. Say white, and I'll cut them out here — that
   gives a better edge than anything it produces.

Frames 3 and 4 need **two** images attached: `visit-child-chair.webp` **and**
`drnour.webp`.

---

## Frame 1 — Sit in the chair

*Attach: `visit-child-chair.webp`*

```
Redraw this exact image on a plain flat white background, keeping the boy and the dental chair completely identical — same face, same hair, same green t-shirt and denim shorts, same pose reclining against the headrest, same chair, same camera angle, same size in frame, same soft 3D clay-render style with rounded matte forms and gentle lighting.

The only change: he is calm and settled, hands resting in his lap, mouth closed in a small easy smile. No tools anywhere in the image. No dentist in the image.

No text, no letters, no numbers, no labels, no watermarks.
```

This one is your master. Everything below is an edit of *this* result — so once
you are happy with it, use **this output** as the attachment for frames 2–5
instead of the original, and keep using the same one throughout.

---

## Frame 2 — Turn on the light

*Attach: your frame 1 result*

```
Keep this image completely identical — same boy, same face, same pose, same hands, same chair, same camera angle, same size in frame, same white background. Change nothing about his body or position.

The only change: a warm butter-yellow pool of light now falls on him from above. It is brightest across his face and chest and fades softly to nothing at the edges. Warm golden highlights where the light lands on the blue chair. His eyes look up toward the light, pleased and curious, still relaxed and comfortable.

Do not draw a lamp or a light fixture in the image — only the light falling on him.

No text, no letters, no numbers, no labels, no watermarks.
```

The lamp itself is already a separate layer in the game, sitting above the
chair. If ChatGPT paints one in, the screen ends up with two.

---

## Frame 3 — Dentist checks with mirror

*Attach: your frame 1 result **and** `drnour.webp`*

```
Keep the boy and the chair from the first image completely identical — same face, same hair, same clothes, same reclining pose, same chair, same camera angle, same size in frame, same white background, same soft 3D clay-render style.

Two changes:
1. His mouth is now open in a comfortable, relaxed "aah" — easy and unforced, not a grimace, not clenched, not distressed. He looks calm and trusting.
2. The woman dentist from the second image — same pink hijab, same blue scrubs, same face — leans in from the right side of the frame. She holds a small round dental mirror with a pale blue handle gently near his mouth, not touching it and not inside it. She is smiling warmly and looking at his face, not at the tool.

Her head should be roughly level with his, leaning in from the right, not towering over him.

No text, no letters, no numbers, no labels, no watermarks. No needles, no blood, no drills, nothing sharp.
```

---

## Frame 4 — Teeth cleaning

*Attach: your frame 3 result*

```
Keep this image completely identical — same boy, same face, same open mouth, same chair, same dentist in the same position, same camera angle, same size in frame, same white background.

The only changes: she is now holding a small polishing handpiece with a soft round rubber cup on the end, gently at his front teeth instead of the mirror. His teeth are visibly bright and clean, with a few small four-point sparkle glints around his mouth. He looks delighted — a wide happy smile, eyes bright. She is smiling too.

The tool must look soft, chunky and toy-like. It must not look like a drill.

No spray, no water jet, no foam, no mess. No text, no letters, no numbers, no labels, no watermarks.
```

---

## Frame 5 — Raise your hand (the stop signal)

*Attach: your frame 1 result*

```
Keep this image completely identical — same boy, same face, same chair, same reclining pose, same camera angle, same size in frame, same white background, same lighting.

The only change: he has lifted one hand clearly into the air beside his head, palm open and facing forward, fingers spread — the "stop, I need a moment" signal. He is calm and confident, looking straight at the viewer with a reassuring smile. This is a deliberate, comfortable raised hand — not a distressed one, and not a friendly wave.

No text, no letters, no numbers, no labels, no watermarks.
```

---

## When you send them back

Drop the five files anywhere and tell me where. I will:

- cut them out to transparent PNG and align them on one shared canvas
- compress to `.webp` at the size the rest of `public/art` uses
- wire them to the four narration steps plus the stop-signal moment

**The one check that matters before you send them:** open all five and flick
between them. Only the intended thing should move. If the boy changes size, the
chair rotates, or the crop drifts, that frame needs redoing as a fresh edit of
frame 1 — because a cross-fade between two frames that don't line up looks like
a glitch, not a camera.
