# Visit walkthrough — the sleepy-juice steps

Two new frames. The handpiece step you asked for **already exists** — it is
frame 4 of the set already in the game (`visit-step-clean.webp`), Dr. Nour with
the soft polishing cup at his front teeth. So the new sequence is:

> mirror *(have)* → **sleepy juice** *(new)* → **count to ten** *(new)* →
> handpiece *(have)*

---

## Attach these

Both prompts are edits of the **mirror** frame, because that is the staging the
new beats continue — same chair, same lean-in, Dr. Nour already in shot.

| Prompt | Attach this file |
|---|---|
| Frame 6 | `F:\Dental_kids\art-in\source-art\visit-steps\3-mirror.png` |
| Frame 7 | your **frame 6 result** |

The five masters now live in `F:\Dental_kids\art-in\source-art\visit-steps\`
(`1-chair`, `2-light`, `3-mirror`, `4-handpiece`, `5-hand`) so this set never
depends on the Downloads folder again.

Same three rules as last time: **plain flat white background** (not
transparent — I cut them here), never chain an edit onto an edit except where
the table above says to, and change only the thing the step is about.

---

## Frame 6 — the sleepy juice

*Attach: `3-mirror.png`*

```
Keep this image completely identical — same boy, same face, same hair, same green t-shirt and denim shorts, same reclining pose in the same blue dental chair, same dentist in the same pink hijab and blue scrubs leaning in from the right, same camera angle, same size in frame, same white background, same soft 3D clay-render style.

The only change: instead of the small round mirror, she is now holding a small lilac pump bottle with a rounded cap and a soft applicator tip, resting it gently near his gum. A tiny sparkle or two where it touches. His mouth is open in the same comfortable, relaxed "aah" as before and he looks calm and trusting — not flinching, not worried.

The bottle must look soft, chunky and toy-like, like a little juice bottle. No needle of any kind, nothing sharp, nothing that looks like an injection or a syringe.

No text, no letters, no numbers, no labels, no watermarks. No blood, no distress.
```

The "no needle" line is the important one — the whole point of calling it juice
is that a child never pictures a needle. If the result shows anything
needle-like, that frame is a fail, not a near-miss.

## Frame 7 — counting to ten

*Attach: your **frame 6** result*

```
Keep this image completely identical — same boy, same chair, same pose, same dentist in the same position holding the same lilac bottle, same camera angle, same size in frame, same white background.

The only changes: the boy's eyes are now gently closed and his mouth is closed in a soft, peaceful little smile — he is calm and relaxed, counting quietly to himself, not asleep and not unhappy. Three or four small soft-edged sparkle dots float in the air above him to suggest the quiet moment passing. The dentist waits patiently and smiles at him, her hand held still.

No text, no letters, no numbers, no digits anywhere in the image — the counting is something he is doing, not something written down.

No watermarks. No distress, no crying.
```

The "no numbers" instruction matters more than usual here: asked to illustrate
counting, an image model will happily paint a floating "1 2 3", and the game is
bilingual — Arabic numerals baked into the art would be wrong in one language
and untranslatable in both.

---

## Send them back

Drop them anywhere and tell me where. I will run them through
`app/scripts/import-visit-steps.mjs`, which cuts the background away and aligns
them to the same shared canvas as the other five, so the chair does not move
when one dissolves into the next.

---

## One thing to decide before I wire them in

**The visit module is currently the same screen for both journeys.** Check-up
and treatment run `clinic → tools → … → visit`, and `visit` has no per-path
setting — so anything added to it is shown to every child.

Sleepy juice belongs in a treatment. Showing it to a child who is coming in for
a check-up teaches them to expect numbing gel they are not going to get, which
is the exact kind of mis-expectation this app exists to prevent.

So these two frames should almost certainly play **only on the treatment path**,
which means the visit module needs to know which journey it is in. That is a
small change and I can make it when the art lands — but it is your call, so tell
me if you would rather every child saw all six steps.

Two new narration lines are needed either way (`visit.step.sleepy`,
`visit.step.count`) in Arabic and English, plus their four clips. The
ElevenLabs key works now, so that part is quick.
