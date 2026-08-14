# Asset Pipeline

The design's ceiling is set by asset format, not code. Sixteen flat PNGs cannot squash, deform, catch light, or be viewed from another angle. This document covers getting them to GLB.

---

## 1. PNG → GLB

**Art source change:** the repo currently credits *"Tool and character artwork adapted from Microsoft Fluent 3D (MIT)."* The client has since supplied ten bespoke 3D renders, which supersede the Fluent set for the chair, light, and all nine tools. Update the credit line in the repo README when the swap lands.


Use an image-to-3D service. Both have APIs, so the batch is scriptable.

- **Meshy** — `POST /openapi/v1/image-to-3d`. Better on hard-surface objects.
- **Tripo** — comparable, sometimes cleaner topology on organic shapes.

Recommended settings: quad topology, ~15k target polys, PBR textures on, symmetry off (most renders are three-quarter views).

```
assets/chair.png     → models/chair.glb
assets/light.png     → models/light.glb
assets/unit.png      → models/trolley.glb
assets/teeth.png     → models/teeth.glb
assets/toothclean.png→ models/tooth-clean.glb
assets/mirror.png    → models/tool-mirror.glb
assets/explorer.png  → models/tool-explorer.glb
assets/suction.png   → models/tool-suction.glb
assets/airwater.png  → models/tool-airwater.glb
assets/polisher.png  → models/tool-polisher.glb
assets/xray.png      → models/tool-xray.glb
assets/ring.png      → models/tool-ring.glb
assets/umbrella.png  → models/tool-umbrella.glb
assets/spray.png     → models/tool-spray.glb
```

`clinic.png` stays 2D — it is used as a full-bleed backdrop, not an object.

### Expect failures
Roughly half will need repair. Thin geometry converts worst: the explorer's hook, the mirror's stem, the light's arm joints, the umbrella's frame. Budget rework rather than accepting bad meshes — one broken model is more visible than ten good ones.

---

## 2. Blender cleanup (Blender MCP)

Connect `blender-mcp` so Claude Code can drive Blender directly. Per model:

1. Remove interior faces and loose geometry.
2. Decimate to budget — 8k tris for tools, 20k for chair and teeth model.
3. Recalculate normals outward; shade smooth with a 30° auto-smooth angle.
4. Set origin to the natural pivot: chair at the base column, light at the ceiling mount, tools at the grip point where a hand would hold them. **Wrong origins ruin every rotation in the motion spec.**
5. Scale to a shared unit: chair 1.2 units tall, tools 0.25 units long.
6. Bake AO into the texture.
7. Export GLB, Draco compressed.

### Rigging
Only three models need bones:

- **Chair** — 3 bones: base, seat, backrest + headrest. Drives the recline.
- **Light** — 3 bones along the arm. Drives the joint stagger.
- **Tooth Hugger Ring** — 2 bones for the closing arms.

Everything else animates as a rigid transform.

---

## 3. Layered art for future renders

For anything generated from here on, request **separated parts on transparent backgrounds** rather than one composed image. A chair as base / column / seat / backrest / headrest converts to a clean rigged model; a single flat chair does not. This applies whether the target is 3D conversion or 2D rigging.

---

## 4. Audio — already built, handle with care

**Correction:** narration already exists in the repo. `app/public/audio/` holds baked ElevenLabs clips, one per string per language, generated ahead of time so it sounds identical on every device and works offline. `scripts/` contains the generation pipeline and needs `ELEVENLABS_API_KEY` in a root `.env`. `docs/` holds the Arabic audio script.

### What this changes
Narration is keyed to strings. **Editing a string means regenerating its clip.** Text is now the most expensive thing in the repo to change.

- Freeze copy with the client before regenerating anything. `COPY.md` marks client-verbatim lines `[CLIENT]` and mine `[DRAFT]` — the drafts each carry an audio cost.
- Have a native Egyptian Arabic speaker verify colloquial pronunciation (`الميّه`, `بوقك`, `الشاليموه`) before committing new Arabic clips.
- Regenerate in one batch, not per-edit.

### What is genuinely missing: SFX
Narration is done; **interaction sound is not.** The motion spec cues a sound on every impact frame, and roughly half of perceived polish lives there.

Generate via ElevenLabs Sound Effects into `app/public/sfx/`:

```
chair-whirr, chair-thunk, light-click, light-hum, trolley-tink,
mirror-shimmer, explorer-tick, suction-slurp, syringe-pssht,
polisher-whirr, camera-shutter, ring-clasp, umbrella-fwoomp,
spray-chime, star-earn, reveal-chime, button-tap
```

All must be soft. The infographic forbids harsh sounds, and there must be no drill noise anywhere in the product.

Also missing: a low-volume background music loop.

### Playback
Extend the existing narration player rather than adding a second audio system. Cue SFX on the impact frame, not the start of the move. Duck music 6dB under narration. Wire Milo's Rive `setTalking` state to narration playback so his mouth matches the baked clip.

## 5. Performance budget

Mobile-first, must run on low-end Android. This is where vibe-coded 3D usually fails.

```
Draw calls        < 60 per frame
Triangles         < 120k on screen
Texture memory    < 48 MB
Target            60fps on a mid-range Android, 30fps floor
Initial bundle    < 2.5 MB, models lazy-loaded per act
```

Tactics: Draco compression, KTX2 textures, instance the tool grid, bake lighting where possible, one real shadow-casting light plus baked AO, and cap the device pixel ratio at 2. Test on a real low-end device before adding bloom — post-processing is the first thing to cut.
