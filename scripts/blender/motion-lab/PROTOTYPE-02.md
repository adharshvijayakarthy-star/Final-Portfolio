# AURA Motion Lab — Prototype 02

Prototype 02 is a refinement loaded directly from `motion-lab-01/landing-to-quick-01.blend`. It does not regenerate or overwrite Prototype 01 and has no application imports or production integration.

## Output

Directory: `.aura-work/blender-poc/motion-lab-02/`

- `landing-to-quick-02.blend` — native editable Blender 5.2 scene; fonts packed.
- `prototype-01-original.blend` — byte-identical preservation of Prototype 01 at the start of this task. The working 01 file was resaved during the session; this copy preserves the initial file without overwriting that later save.
- `landing-to-quick-02.mp4` — 960 × 540, H.264, 30 fps, 15 seconds.
- `review.html` — standalone local video review with stage buttons, keyboard-operable frame slider, and synchronized Prototype 01 comparison.
- `frame-*.png` — 1280 × 720 checkpoint renders.
- `motion-manifest.json` — original source checksum, preservation checks, stages, palette and per-character reveal schedule.
- `fonts/` — Instrument Serif regular/italic, IBM Plex Mono regular, and their OFL licenses.

The existing garden GLB POC and all production files remain outside this experiment. The local review page is not a Next.js route.

## Preserved choreography

All **8,611 original key values** are numerically checked after loading and refinement. The camera's lateral/depth/roll motion, two 65-point path morphs, six anchors, navigation entrance, text trajectories and depth rails retain their original checkpoints. Original camera curves and morph curves are shifted intact. The shift is **+150 frames**, adding a five-second opening prelude; the original transition's relative timing is retained.

Additional small counterbalance keys sit between existing typography keys. The introductory line receives a small downward intermediate adjustment to clear the expanding arc. The original text objects remain as transform parents for their visible character objects. No main transition animation is removed.

## New layers

**Typography.** AURA reveals first, then Adharsh, Vijayakarthy, the three roles and supporting text. Each character has a small staggered opacity ramp and a restrained vertical/rotational settle. There is no cursor. The main identity completes before the environmental transition; the same visible characters subsequently follow their Prototype 01 parent trajectories.

**Embers.** 72 dim, small, softly feathered background quads sit at deeper Z positions. 18 brighter foreground quads use stronger rising trajectories, different lifetimes, lateral drift and mild turbulence. Deterministic seeded variation controls size, phase and opacity. The field responds subtly during the spatial reorganization. The original six anchors are preserved separately; Prototype 01 did not contain an ember system.

**Atmosphere.** Low-opacity crimson/graphite washes and four quiet peripheral facets reference the actual Threshold environment. The original camera's travel produces parallax between these layers. No new particle simulation, physics, image texture or heavy geometry is introduced.

## Production identity sources (read-only)

- `src/sections/entry/Threshold.module.css`: background `#07070a`, warm ivory `#e8e2d8`, crimson `#c0182a`, graphite facets.
- `src/sections/entry/ThresholdRuntime.tsx`: rising embers and occasional warm `rgb(238,132,86)` sparks.
- `src/sections/quick-discovery/QuickDiscovery.module.css`: purple mark `#9b72cf`, supporting text `#a69c92`, crimson atmosphere.
- `src/lib/fonts.ts`: Instrument Serif and IBM Plex Mono.

CSS sRGB colors are converted to scene-linear values before emission shading, with Blender's Standard view transform. Fonts were obtained from the official [Google Fonts Instrument Serif](https://github.com/google/fonts/tree/main/ofl/instrumentserif) and [IBM Plex Mono](https://github.com/google/fonts/tree/main/ofl/ibmplexmono) directories. No production font or CSS file is changed.

## Timing

| Frames | Stage |
| --- | --- |
| 1–17 | Quiet atmosphere |
| 18–41 | AURA reveal |
| 42–117 | Name and surname reveal |
| 118–181 | Roles, supporting copy and entry complete |
| 182–204 | Hold and original anticipation |
| 205–252 | Release, primary travel, trailing response |
| 253–300 | Secondary travel, reorganization, depth handoff |
| 301–348 | Depth crossing, rail preparation, Quick takes shape |
| 349–396 | Hierarchy and final alignment |
| 397–420 | Settling |
| 421–450 | Quick arrival hold |

26 native timeline markers identify the detailed stages. Compare Prototype 02 frame F with Prototype 01 frame F−150 after the prelude.

## Rebuild and render

From the repository root in PowerShell:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --gpu-backend opengl --background --factory-startup --python scripts/blender/motion-lab/refine-landing-quick-02.py -- --stills
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --gpu-backend opengl --background .aura-work/blender-poc/motion-lab-02/landing-to-quick-02.blend --python scripts/blender/motion-lab/refine-landing-quick-02.py -- --render-only
```

Use **`--gpu-backend opengl` on this machine**. The default backend produced black frames even when rendering the unchanged Prototype 01; an explicit OpenGL render and a CPU Cycles diagnostic both produced the actual scene. Keep the second motion-study Blender viewer closed during export: an export interrupted by opening that viewer produced black later frames. No system or Blender preference was changed. Blended transparency avoids grain in the low-opacity atmosphere at preview sample counts.

The review player can be opened directly as a local HTML file. For browser hosting, use a server with HTTP byte-range support so video seeking works reliably. The task's isolated review server is `.aura-work/motion02-review-server.cjs`, listening only on localhost port 3128. It serves the Blender output directory, not the portfolio application.

The source is 1280 × 720 / 16 Eevee samples. The review command renders at 75% / eight samples and does not resave the source at reduced quality. Open the blend in Blender, press Space to play, and scrub the Timeline. Native animation playback needs no Python handlers, live simulations or external fonts.

## Next refinement for review

Evaluate the opening's reading hold, small-copy clearance through the widest arc, and ember prominence at normal playback speed before choosing a shorter eventual navigation duration. This 15-second motion study establishes the full reveal and transition; it is not a proposed 15-second production navigation delay. No Prototype 03 or web integration is part of this work.

## Completed verification

- Rendered all 450 frames. MP4 metadata: 15 seconds, 960 × 540, no media error.
- Twelve video checkpoints decoded to distinct, nonblack images. Inspected reveal, complete identity, spatial reorganization and final Quick state.
- Video playback reached its end. Frame slider keyboard step: 450 → 449.
- Comparison at Prototype 02 frame 277 seeks Prototype 01 to 4.2 seconds.
- Review page has no JavaScript errors or horizontal overflow at 390px.
- Compared 157,800 camera/morph samples to the preserved starting Prototype 01: maximum difference zero after +150 frames.
- 26 markers, 113 revealed glyphs, 242 scene objects, three packed fonts, no frame-change handlers. Blender GUI scrubbing checked.
- All 167 protected production/reference/script/original garden POC files unchanged. The initial Prototype 01 blend is additionally retained byte-for-byte as `prototype-01-original.blend`; its existing MP4 remains unchanged.

Machine-readable results are in `scene-verification.json` and `video-verification.json` beside the output. The final render took approximately 9.5 minutes on this computer. No production build was run because this experiment does not change the application.
