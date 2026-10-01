# Stay Awhile — first four Blender scenes, final polish and export

Completed 2026-09-24. Scope: Garden, Person, Builder and Thinker Blender masters, composed renders, paired GLBs and their handoff records. The existing camera rails, asset IDs, collection names, guides and authored Action names were retained. No website source was edited in this pass.

## Scene decisions

| Scene | Final change | Render result |
|---|---|---|
| Garden | Narrowed and gently staggered the existing path stones, added a short terrain grounded continuation at the focal end, and grouped low planting on the near path shoulders. | Wide, medium and focal views retain clearings while the last stones have a planted edge. The shared Garden terrain remains under its triangle caps: 16,494/18,000 desktop and 4,832/5,000 mobile. |
| Person | Reviewed the existing wide, medium and focal views and retained the current geometry and lighting. | The quiet bench and root arch read in the wide and medium views. The late focal rail gives a close, partly cropped bench view. |
| Builder | Removed 14 coplanar decorative beam strips from the desktop/mobile B03 collections. The original animated beams remain. | The nearly black central roof bar is gone; structure and workbench remain clear. |
| Thinker | Straightened the malformed near edge of the last T01 deck plank in both LODs (10 desktop, 2 mobile vertices). | The black overlapping wedge is gone in wide, medium, focal and mobile poster views. Pond, shoreline and tea setting remain. |

## Final checks

- The final 12 desktop camera views are in `.aura-work/blender-beauty/final-views/` (wide, medium and focal for each route). The eight current desktop/mobile posters are in `public/assets/stay/v1/`. All four poster corridor checks returned no violations; all eight posters meet their file caps.
- All four masters reopen. The three dependent masters resolve the relative Garden library. Composition instance counts, export collections, roots, camera guides and scene manifests pass the scoped check.
- All 26 first-four assets have desktop and mobile GLBs: 52/52 meet their individual triangle and file-size caps. Source/export triangle counts match; 147 beauty mesh occurrences were found in the paired GLBs. The four scene manifests and 26 asset-manifest records carry current hashes.
- Khronos glTF Validator: 52 files, zero errors, zero warnings. `KHR_mesh_quantization` is used for compact lossless-image handoff and small geometric quantization; the bundled Three.js GLTFLoader lists this extension. No external compression decoder is required.
- Seven Builder/Thinker authored Actions remain. Both variants export the specified clips: 14 animated GLBs, 450 sampled transform comparisons, zero motion errors. Eight static desktop/mobile GLBs were reimported to Blender; the largest source/import bounds difference was 0.00127 m.
- Source reverse seeking across five frames and desktop/mobile anchor names and positions pass for all four routes. The historical protected-file baseline flags twelve Stay website files already modified when this pass began; no website file was edited during this pass.

## Remaining visual and integration limits

- The established low-poly foliage and distant tree bank still read as deliberately stylized rather than naturalistic, especially on mobile. The open ground beyond Garden's path remains a deliberate clearing.
- Person's late focal camera view crops the bench. The rail and camera guides were preserved as required.
- This pass validates Blender assets and GLBs. It does not assert browser loading, runtime interaction or website layout behavior.

## Evidence

- `validation-first-four.json` — reopened masters, collections, guides, beauty geometry, per-file size/triangle checks.
- `khronos-first-four.json` — independent glTF format validation.
- `motion-first-four.json` — authored animation comparison.
- `roundtrip-first-four.json` — static source/GLB bounds checks.
- `poster-review.json` — final poster dimensions, bytes and camera corridor results.
- `delivery-inventory.json` — first-four rows refreshed; the earlier global validation status remains marked historical.
