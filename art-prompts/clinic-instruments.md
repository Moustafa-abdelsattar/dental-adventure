# Screen one — the suction and the air-water syringe, in the room's own light

## Why the current ones look stuck on

They were drawn for the tools board, where each instrument is a bright object on
a flat card and is *meant* to pop. Standing them in a room breaks four things at
once:

1. **Too saturated.** The room is muted cream, mint and pale blue. The props are
   candy teal, hot pink and primary yellow, and they are the loudest thing on
   screen by a distance.
2. **Lit from the front.** The room has one soft light from the upper left with
   long gentle falloff. The props carry their own flat all-round studio light,
   so nothing on them agrees with the shadows behind them.
3. **Wrong camera.** The room is three-quarter from slightly above. The props
   are drawn straight on, so they read as stickers on a photograph.
4. **No base.** They are instruments with nothing holding them, which is why
   they needed a fake contact shadow to look like they were resting at all.

The fix is two new renders, not a filter and not a new room — each of the four
objects on this screen has to stay its own transparent image so it can move
when a child presses it.

## Attach to both prompts

- `app/public/art/clinic-room.webp` — **the** style reference. Palette, light
  direction, camera height and finish all come from this.
- the matching shape reference below, so it stays the same instrument the child
  meets again on the tools board.

Ask for a **plain flat white background**. I cut them out here.

---

## Prompt A — the suction

*Attach: `clinic-room.webp` and `app/public/art/tool-suction.webp`*

```
A children's dental suction straw in a soft 3D clay-render style, resting upright in a small cream cradle holder. Match the attached room reference exactly for palette, lighting and camera: muted cream, pale blue and soft mint, a single soft light from the upper left with gentle falloff and a soft contact shadow beneath, matte clay surfaces, three-quarter view from slightly above.

The instrument keeps the shape of the second reference — a slim handle with a gently curved tip and a soft collar — but rendered in the room's muted palette rather than bright toy colours: cream body, pale blue collar, one small soft accent. It sits in a low cream holder that its base rests inside, so it is clearly standing on something.

Chunky, rounded and friendly. Nothing sharp, nothing metallic and clinical, nothing that reads as adult medical equipment.

Plain flat white background. No text, no letters, no numbers, no labels, no watermarks.
```

## Prompt B — the air-water syringe

*Attach: `clinic-room.webp` and `app/public/art/tool-syringe.webp`*

```
A children's dental air-water syringe in a soft 3D clay-render style, resting upright in a small cream cradle holder. Match the attached room reference exactly for palette, lighting and camera: muted cream, pale blue and soft mint, a single soft light from the upper left with gentle falloff and a soft contact shadow beneath, matte clay surfaces, three-quarter view from slightly above.

The instrument keeps the shape of the second reference — a rounded body with a slim curved nozzle and a small button — but rendered in the room's muted palette rather than bright toy colours: cream body, pale blue nozzle, one small soft accent in coral. It sits in a low cream holder that its base rests inside, so it is clearly standing on something.

Chunky, rounded and friendly. Nothing sharp, nothing metallic and clinical, nothing that reads as adult medical equipment.

Plain flat white background. No text, no letters, no numbers, no labels, no watermarks.
```

---

## The test before you send them

Put the two results side by side with `clinic-room.webp` open next to them. If
either one is the brightest thing on the screen, it is wrong — in that room
nothing should out-shout the chair. They should look like they were rendered in
the same afternoon as the room, not placed on top of it.

Send them over and I re-run `scripts/place-clinic-tools.mjs`: it cuts them out,
stands them on the unit and re-measures both tap boxes off the alpha. No code
changes, and the built-in cradle means the fake contact shadow can go.
