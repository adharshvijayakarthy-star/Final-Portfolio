# AURA Motion Lab 01 — Landing → Quick Discovery

Isolated motion study created and rendered in Blender 5.2.1 LTS. No website integration, external assets, additional packages, or changes to the original garden POC.

## Files

Output directory, relative to the repository:
`.aura-work/blender-poc/motion-lab-01/`

- `landing-to-quick-01.blend`: editable native Blender scene.
- `landing-to-quick-01.mp4`: 960 × 540 H.264 review render, 30 fps, 10 seconds.
- `review.html`: standalone video player with a frame slider and stage jumps. Open locally; it is not a Next.js route.
- `frame-*.png`: six 1280 × 720 checkpoint renders.
- `motion-manifest.json`: scene, frame rate, duration and stage markers.

Open the blend file and use Space to play, or drag the Timeline playhead to scrub. Select the camera or individual objects to inspect their keys. The scene includes a READ ME text block. Playback needs no Python handlers.

## Choreography

| Frames | Purpose |
| --- | --- |
| 1–36 | Landing composition hold |
| 37–54 | Anticipation and compression |
| 55–78 | Entry outline releases; identity starts moving |
| 79–102 | Primary travel |
| 103–126 | Secondary elements follow with stagger |
| 127–150 | Spatial reorganization |
| 151–174 | Depth crossing and camera momentum |
| 175–198 | Quick composition becomes recognizable |
| 199–222 | Hierarchy and navigation emerge |
| 223–246 | Final alignment |
| 247–270 | Small settling corrections |
| 271–300 | Quick opening hold |

The name, introduction and role words persist as the same objects. Two continuous red/purple curves transform from the entry outline through a spatial loop into the navigation rail. Six anchors follow staggered paths. The camera moves laterally and in depth with restrained roll. Native Bezier keys, animated curve points, subtle overshoot and Eevee motion blur connect the authored checkpoints. No crossfade, scene cut, random particles or final typography design.

## Reproduce (PowerShell, repository root)

The script has an explicit ROOT matching this workspace; update that one variable if relocating the project. Use a separate background process to preserve any currently open unsaved Blender work.

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --factory-startup --python scripts/blender/motion-lab/create-landing-quick-01.py -- --stills
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background .aura-work/blender-poc/motion-lab-01/landing-to-quick-01.blend --python scripts/blender/motion-lab/create-landing-quick-01.py -- --render-only
```

The source scene is set to 1280 × 720. The review-render command uses 75% resolution and eight Eevee samples for this computer's integrated GPU. It does not resave the scene at this reduced quality. No GLB export is needed for this motion study.

## Reference study

Reviewed public scroll/arrival behavior at [Lando Norris](https://landonorris.com/) and [Sondaven](https://sondaven.com/ua). The motion study explores persistent anchors, delayed layer response and continuous changes in framing. Their branding, assets and typography were not imported.

This is a first choreography proposal for review, not a production transition or final visual design. Stop here before any Next.js integration.
