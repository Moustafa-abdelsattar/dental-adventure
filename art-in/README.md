# Incoming art

Drop raw assets here. Nothing in this folder ships — everything is processed
into `app/public/` by a script, so originals stay untouched and re-runnable.

## `source-art/` — images

The client's renders and anything extracted from the PPTX. Background knocked
out, alpha trimmed, semantically named.

### `source-art/clinic/` — layered scene art

Anything that has to move in parts goes here instead, and is imported by a
different script:

```bash
cd app
node scripts/import-layers.mjs --dry   # validate a drop, write nothing
node scripts/import-layers.mjs         # import it
```

A folder is a **layer set** — one object delivered as several pieces. A loose
PNG is a single image.

```
source-art/clinic/
├── room-empty.png        single   → public/art/clinic-room-empty.webp
└── chair/                set      → public/art/clinic-chair-base.webp
    ├── base.png                     public/art/clinic-chair-headrest.webp
    └── headrest.png
```

**Every file inside a set folder must share one canvas size**, with each part
sitting where it belongs on that canvas. Do not crop the pieces and do not
re-centre them.

This is the whole reason the script exists. `import-art.mjs` trims each image to
its own content box, which is correct for a standalone prop and destroys a layer
set — trim a base and a headrest separately and each lands at a different
offset, so the headrest no longer meets the backrest. `import-layers.mjs` never
trims, scales every layer in a set by one shared factor, and rejects a set whose
layers disagree about the canvas rather than importing it crooked.

## `models-raw/` — GLB straight from the generator

Unoptimised exports from Meshy or Tripo. Expect them to be huge; that is fine,
this folder is not shipped.

Process one with:

```bash
cd app
node scripts/optimize-glb.mjs ../art-in/models-raw/<name>.glb public/models/<name>.glb --tris 15000 --tex 1024
```

Use `--tris 20000` for the chair and the teeth model, `--tris 8000` for tools.

### Filenames the game looks for

The loader resolves these exact names in `app/public/models/`:

| Source image | Optimised model |
|---|---|
| `chair.png` | `chair.glb` ✅ done |
| `light.png` | `light.glb` |
| `unit.png` | `trolley.glb` |
| `teeth.png` | `teeth.glb` |
| `toothclean.png` | `tooth-clean.glb` |
| `mirror.png` | `tool-mirror.glb` |
| `explorer.png` | `tool-explorer.glb` |
| `suction.png` | `tool-suction.glb` |
| `airwater.png` | `tool-airwater.glb` |
| `polisher.png` | `tool-polisher.glb` |
| `xray.png` | `tool-xray.glb` |
| `ring.png` | `tool-ring.glb` |
| `umbrella.png` | `tool-umbrella.glb` |
| `spray.png` | `tool-spray.glb` |

`clinic.png` stays 2D — it is the room backdrop, not an object.

### Generator settings

Quad topology if offered, ~15k target polys, PBR textures on, symmetry off
(most renders are three-quarter views). Generate with **Meshy 5** — Meshy 6 and
7 outputs are download-locked behind a subscription.

### Which models need separated parts

Most can be one welded mesh. Three cannot, because something on them has to
bend or move independently:

- **`light.glb`** — glass head / lower arm / upper arm + ceiling mount. The arm
  joints stagger by 90ms, and the glass has to glow on its own or the whole
  fixture lights up like a bulb.
- **`chair.glb`** — base + column / seat / backrest + headrest, for the 14°
  recline. The current welded export teeters correctly but cannot recline.
- **`tool-ring.glb`** — two arms, so the hugger ring can close.

Everything else animates as a rigid transform and is fine welded.
