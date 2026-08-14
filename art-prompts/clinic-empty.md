# Empty clinic room — backdrop plate

**Output:** `art-in/source-art/clinic-empty.png` · 5:4 landscape, same 1402 × 1122 as `clinic.png`

## Why

`clinic.png` already has the chair, the overhead lamp, the stool and the
delivery unit painted into it. Those three become real 3D objects standing in
front of the backdrop, so the plate underneath has to be the room *without*
them — otherwise the child sees two chairs.

Everything that does not move stays in the plate. Only what animates gets
lifted into 3D.

## How to make it — best method first

1. **Erase, don't regenerate.** Open `clinic.png` in any generative-fill or
   inpaint tool and paint out the four items below. This is the best result by
   far: every wall, tile, poster and shade stays pixel-identical, so the 3D
   objects land in a room that matches exactly.
2. **Image-to-image**, with `clinic.png` supplied as the reference and the
   prompt below, low-to-medium denoise so the room holds its style.
3. **Text-to-image** with the prompt below — last resort, since the room will
   drift from the original.

## Remove

- The blue dental chair, including its white base and the footrest
- The overhead surgical lamp and the whole white arm column it hangs from
- The dentist's blue stool on castors
- The delivery unit — the white cart with the grey hoses, the cup, the little
  screen on its arm, and the rinse basin

Leave the **floor and rug clear and unobstructed** in the centre — that space
is where the 3D equipment goes.

## Keep exactly as-is

Mint-teal walls · cream tiled floor · the arched window with blue sky, clouds
and green trees · the three framed pastel posters on the left wall (tooth,
toothbrush, toothpaste) · the purple hippo plush on the windowsill · the wooden
shelf with books and small tooth figures · the glowing tooth-shaped
"Healthy Teeth Happy Smile!" sign on the right wall · the pastel drawer run in
yellow, purple, pink and blue with the white sink and chrome tap · the potted
plants · the tooth plushes and figurines · the round blue rug with the smiling
tooth face and pastel hearts · the small stars scattered on the walls · the
recessed ceiling spotlights and the blue ceiling cove · the low cabinet and
storage on the left.

## Prompt

```
A cheerful children's dental clinic room, empty of equipment. Soft 3D
clay-render style, smooth rounded forms, matte pastel surfaces, gentle
studio lighting, kawaii and toy-like, no harsh shadows.

Mint-teal walls and a cream tiled floor. An arched window on the left with
a blue sky, soft clouds and green trees outside. Three framed pastel
posters on the left wall showing a smiling tooth, a toothbrush and a tube
of toothpaste. A purple hippo plush sitting on the windowsill. A wooden
wall shelf with colourful books and small smiling tooth figurines. On the
right wall, a large glowing tooth-shaped sign reading "Healthy Teeth Happy
Smile!". A run of low cabinets with pastel yellow, purple, pink and blue
drawers, a white basin and a chrome tap. Potted green plants, small tooth
plush toys, and a cup of toothbrushes. A round blue rug on the floor with
a smiling tooth face and pastel hearts. Small stars on the walls, recessed
ceiling spotlights and a soft blue ceiling cove.

No dental chair, no overhead lamp, no stool, no equipment cart, no hoses.
The centre of the room and the rug are completely clear and unobstructed.

Three-quarter view looking slightly down into the room corner, wide shot,
5:4 aspect ratio.
```
