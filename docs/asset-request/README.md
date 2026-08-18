# Image prompts — the tools screen

Two prompts. The first makes the instruments; the second makes the screen they
live on.

**Attach `app/public/art/clinic-room.webp` as a style reference to both.** It is
the single highest-leverage instruction — it locks the clay-render look, the
palette, the camera height and the light direction to what the game already
uses. Without it you get a different-looking room and nothing matches.

The tool names below are the ones the narration already says, and that audio is
already recorded in Arabic and English. The art has to match the words, not the
other way round.

| # | In the game | What it looks like |
|---|---|---|
| 1 | Dental Mirror | round mirror, pale blue handle |
| 2 | Tooth Counter | slim probe, gently curved tip, cream handle |
| 3 | Thirsty Straw | suction straw, soft blue collar |
| 4 | Wind and Water Wand | air-water syringe, metal nozzle, coral button |
| 5 | Polishing Brush | handpiece with a small soft cup on the end |
| 6 | Tooth Camera | chunky rounded handheld x-ray |
| 7 | Tooth Hugger Ring | tiny rounded ring clamp |
| 8 | Tooth Umbrella | small folded rubber sheet |
| 9 | Sleepy Gel | lilac pump bottle, rounded cap |

The check-up journey only shows four — mirror, straw, wand, brush. The other
five are the treatment journey. Both come out of the same picture.

---

## Prompt A — all nine instruments, in the clinic

> A children's dental clinic instrument scene in a soft 3D clay-render style:
> rounded matte forms, plush and toy-like, gentle rim lighting, soft contact
> shadows. Match the style, palette, camera height and light direction of the
> attached reference exactly. Palette of cream, pale blue, mint, butter yellow
> and soft pink.
>
> A cream dental delivery unit stands centre frame, with five instrument hoses
> hanging from its front in a neat row. Its pale blue tray is wide, and laid out
> across it, left to right, are nine toy-like dental instruments, evenly spaced
> with clear empty space between them so that no two overlap or touch:
>
> a round dental mirror with a pale blue handle; a slim probe with a gently
> curved tip and a cream handle; a suction straw with a soft blue collar; an
> air-water syringe with a rounded metal nozzle and a coral button; a polishing
> handpiece with a small soft cup on the end; a chunky rounded handheld x-ray
> camera; a tiny rounded ring clamp; a small folded rubber sheet like a little
> umbrella; and a lilac pump bottle with a rounded cap.
>
> Every instrument is friendly, chunky and toy-like — nothing sharp, nothing
> surgical, nothing that reads as medical equipment for adults. Behind the unit,
> a softly blurred pastel clinic wall with rounded cabinetry.
>
> Three-quarter view from slightly above, single soft key light from the upper
> left.
>
> No text, no letters, no numbers, no labels, no packaging writing, no
> watermarks anywhere in the image. No needles, no blood, no open mouths, no
> gore.

### The "no text" line is not boilerplate

The clinic render we already have says "Healthy Teeth Happy Smile!" on the wall,
in English, baked into the pixels. Half this game's audience reads Arabic, and
every other word in the product is live text for exactly that reason. I have had
to blur that sign out in code. Do not accept a generated image with words in it,
however small — labels on bottles count.

### Then ask for the cutting pass

Run the same prompt again with this appended:

> Identical scene, identical camera, identical lighting. Show only the nine
> instruments, floating in their same positions, on a plain flat white
> background. No unit, no tray, no wall, no shadows cast onto anything.

That second image is what gets cut into layers. Because it keeps the same
positions and canvas, each tool lifts out and drops straight back onto the first
image where it belongs — which is what lets a tool light up or lift on its own
when a child presses it. Deliver both at the same pixel size.

This is exactly how the client's own PowerPoint is built, and it is why the
clinic screen works: the room, plus each object again on its own, in place.

---

## Prompt B — the tools screen

Portrait, for a phone.

> A children's dental clinic scene in soft 3D clay-render style, vertical
> portrait composition, matching the attached reference for palette, lighting
> and camera. Cream, pale blue, mint, butter yellow and soft pink.
>
> A cream dental delivery unit stands in the middle of the frame, seen slightly
> from above, with five instrument hoses hanging in a neat row from its front
> and a wide pale blue instrument tray on top. Behind it, a soft pastel clinic
> wall with rounded cabinetry, gently out of focus. Below it, a pale mint floor
> with a soft round rug.
>
> Across the lower third of the image, a shallow empty groove runs left to
> right, like a smooth rounded channel pressed into a cream panel — a track with
> nothing in it, softly shadowed inside, with small rounded end caps.
>
> Leave the upper fifth of the image calm and uncluttered.
>
> Soft key light from the upper left, gentle contact shadows, no harsh
> reflections.
>
> No text, no letters, no numbers, no labels, no watermarks anywhere. No
> needles, no blood, no open mouths.

### Why the groove is empty

Ask for the **track**, never a filled bar. The filled part has to be drawn by
the app so it can actually move as the child earns each tool, and so it never
contains a number or a word that would need translating. A painted-in bar is a
picture of progress; it cannot fill, and it would be wrong in Arabic. The empty
groove is art, the thing that slides along it is not.

Same for the two blank areas: the title goes at the top and the button at the
bottom, both as live text, in whichever language the child chose.
