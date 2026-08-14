# Incoming art

Drop raw assets here. Nothing in this folder ships — everything is processed
into `app/public/` by a script, so originals stay untouched and re-runnable.

## `source-art/` — images

The client's renders and anything extracted from the PPTX. Background knocked
out, alpha trimmed, semantically named.

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
