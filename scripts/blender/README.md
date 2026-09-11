# Phase 0: manual Blender → GLB → Next.js

## Status

The isolated viewer and scene-generation script are prepared. Blender has NOT
been launched or controlled by the coding agent. Until the manual run and actual
GLB browser inspection pass, this pipeline is **not yet proven**.

## Manual Blender workflow

1. Open Blender and select the Scripting workspace.
2. In the Text Editor, choose Text → Open and open `create-aura-poc.py` in this directory.
3. Choose Run Script (Alt+P with the pointer over the Text Editor).
4. The script creates/clears only the `AURA_POC` test scene. It generates a ground
   plane, seven path stones, a tree with three branches and canopies, simple grass,
   a stone, a lantern, a perspective camera and a single sun light. Geometry is
   deliberately low detail; randomness uses seed 42.
5. The script saves only the test scene and its dependencies to
   `.aura-work/blender-poc/aura-garden-poc.blend`, outside `public/` and ignored by Git.
6. The same manual script run exports
   `public/models/aura-poc/aura-garden-poc.glb`, plus a private export report at
   `.aura-work/blender-poc/export-report.json`.

The script is authored for Blender 4.x/5.x APIs but has not yet been executed in
your installed Blender version. If Blender reports an error, stop and share the
exact error. Do not replace the asset with a browser-generated model.

For a later manual re-export: select the AURA_POC scene, File → Export → glTF 2.0,
format GLB, Active Scene enabled, Materials exported, Cameras and Punctual Lights
enabled, animations disabled, +Y Up enabled. Export to the same GLB path.
Principled BSDF material colors and roughness export; Blender World lighting does
not. The test uses an exportable SUN instead of an unsupported Area light.

## Next.js workflow

Run `npm run dev` and open `/prototype/blender/` on the URL printed by Next.js.
Refresh after exporting. Missing GLB produces an explicit waiting message;
WebGL/parse/export problems produce an error instead of a fake scene.

The route uses Three.js GLTFLoader and OrbitControls directly. Only `three` is
added at runtime, plus `@types/three` for TypeScript. R3F/Drei are unnecessary for
this single static viewer. No new animation library is installed.

The browser preserves imported geometry, PBR materials and exported light. Its
own camera starts at the exported camera's world position with the exported FOV;
viewport aspect is controlled by the browser. Drag to orbit, right-drag to pan,
scroll/pinch to zoom, or Reset camera. The camera targets Blender (0, 0, 0.8),
converted to glTF Y-up. Named objects remain available for future website control.

Rendering is on demand (orbit/resize), pixel ratio is capped at 2, and GPU
resources/listeners are disposed when the prototype unmounts. The status line
reports actual asset size, mesh/material counts, triangles and draw calls once
the real asset renders. No FPS or asset size claim is valid before that run.

## Verification checklist after manual export

- Export report identifies the local Blender version and successful GLB output.
- Viewer displays actual path, tree/branches, grass, stone and lantern geometry.
- Green ground/leaves, brown trunk, grey stones and warm lantern pane remain distinct.
- Entire scene is framed; orbit changes perspective, proving depth; Reset works.
- Refresh loads the same GLB; inspect browser console for errors.
- Record GLB size, draw calls, triangles and observed interaction responsiveness.
- Run `npm run check` and `npm run build`.
- Existing production route/animation sources must remain unchanged.

## Isolation and removal

No production route imports this experiment. It inherits the existing root
layout as all App Router pages do, but does not import Quick Discovery, Stay
Awhile, their content, motion providers or animation engines. Existing root
layout, fonts, tokens and production page files are unchanged.

Remove `src/app/prototype/blender/`, `public/models/aura-poc/`, and
`scripts/blender/` to remove the POC. Remove `three` and `@types/three` from the
package manifest with npm uninstall if nothing else subsequently uses them.
Optionally remove the private `.aura-work/blender-poc/` source/export report.
No navigation links or production components need to be repaired.

This test is local and not published to the production Site. Stop at a verified
GLB render; portfolio redesign, scroll choreography and final environments are
outside Phase 0.

## Reference APIs

- https://threejs.org/docs/pages/GLTFLoader.html
- https://threejs.org/docs/pages/OrbitControls.html
- https://docs.blender.org/api/current/bpy.ops.export_scene.html
