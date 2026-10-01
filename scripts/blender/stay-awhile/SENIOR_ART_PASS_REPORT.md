# Stay Awhile — senior Blender art pass

Delivery date: 2026-09-28. This report supersedes earlier art and package summaries. Scope is Blender sources, asset production Python, textures, GLBs, manifests and rendered evidence. Website source was protected against the entry snapshot.

## Delivered work

All ten existing masters were refined in place. The package retains 47 logical asset IDs, 47 desktop GLBs, 47 mobile GLBs and exactly 18 authored clips. The original masters and published assets were copied to `.aura-work/senior-art-pass/baseline` before work began.

The largest replacement is the tree system. G01's embedded grove, G03's Sakura trunk, G11's distant bank and F01's opening canopy now use reduced, proportionally varied geometry derived from Poly Haven's **Tree Small 02**, rather than the earlier simple procedural trunks. The source's actual crown distribution informed the new foliage placement. Branch cards from the high-resolution source were rejected because they did not reduce cleanly into the required budgets. Green crowns and G04 shrubs use cropped, masked botanical leaf sprays; Sakura uses newly modeled opaque flower geometry. This is an adaptation of an external model, not a claim that the entire source tree was imported unchanged.

Other substantial changes:

- G04 shrubs have stems and layered leaves in place of angular floating clusters. G10 fern variants have curved fronds, narrow paired leaflets and varied spread.
- G06's four stone variants were rebuilt with irregular profiles. Selected G14, P02, B01, T02, F03 and C02 stones were smoothed/refined where their budgets allowed.
- G01's terrain uses sourced ground color, roughness and normal detail, restrained vertex variation, grounded perimeter planting and additional tree depth. Bright closed leaf volumes were corrected to moss cushions. Redundant desktop terrain edges were reduced; the measured maximum displacement of retained vertices from the prior surface was **5.23 mm**. This measurement is not a full continuous-surface Hausdorff bound.
- G09's hills were softened and moved outward, and its skirt uses the ground material. This removes the dominant close hill in Contact and the flat material seam in Future.
- Timber gained shared cedar grain, roughness and normal detail, with small edge bevels on budget-compatible parts. Person's exposed roots use bark rather than sawn-timber mapping.
- Leader's court gained earthen surface detail. Thinker's water received restrained static surface variation and more reflective material settings. Water motion remains runtime-owned.
- AURA's shelf fascia was reduced to reveal the documents and connections more clearly; the paper has slight shape variation. Its original pivots and three authored assembly clips remain intact.
- Perimeter fern/stone placements, distant tree banks and restrained additional Sakura placements were authored into source compositions and their scene manifests. Camera guides were preserved.
- Daylight, shade fill and Stories' warm lantern treatment were refined in the Blender lighting setup. Lighting is reference composition lighting, not a new browser lighting implementation.

## Route review

| Route | Strongest improvement | Remaining limitation / deliberate constraint |
|---|---|---|
| Garden | More credible trunks, layered shrubs/ferns, quieter moss cushions and tactile wayfinding/path stone. | Sakura remains visibly stylized close to the camera; the mobile crown is more sparse. |
| Person | Bark-covered root convergence and a more tactile timber-and-stone bench, framed by natural foliage. | The locked primary camera emphasizes roots; the bench reads most clearly in the wide and material views. |
| Builder | Cedar grain, edge highlights and improved foundation/bench detail make the assembly feel more constructed. | Small work tokens retain abstract forms and no authored labels. The sheltered bench is intentionally darker than the open garden. |
| Thinker | Reflective pond, clearer shoreline planting and warmer deck grain. | The scroll remains unlettered; water is a static Blender/GLB surface, with no authored ripple animation. |
| Leader | Earthen courtyard, refined stones and a warmer, less flat lesson rail. | The broad court and compact nodes remain intentionally simple; semantic labels belong outside the geometry. |
| Stories | Warm light pools reveal stone texture, timber shutters and layered planting. | The dusk environment has darker distant vegetation; its empty display surfaces are intentional. |
| Work | Material depth and joinery across the pavilion and five existing station assemblies. | Stations remain symbolic physical artifacts; neither evidence nor readable portfolio content was fabricated. |
| Future | Varied canopy at the entry, a continuous ground surface and a clear distant marker. | The late locked camera is beyond much of the modeled widening path, so the primary frame is predominantly open ground and horizon. |
| AURA | Slimmer spine shelves, warm structural timber, paper variation and readable brass connections. | The central spine remains dominant at the locked primary camera. The documents intentionally contain no meaningful text. |
| Contact | Lower distant hills, a quieter horizon and a more tactile resting stone. | The scene is deliberately sparse; it is a visual resting point rather than a second dense garden. |

The visual audit covers silhouette, tree quality, density, terrain, paths, materials, lighting, foreground/midground/background depth, route identity and camera composition. `SENIOR_VISUAL_AUDIT.md` records the grouped observations. This is a stylized, budget-constrained environment; this report does not characterize it as photorealistic.

## Export and verification

The final numeric results are in `senior-delivery-summary.json` and `astra-v2-final-package-check.json`. Validation was refreshed after the last geometry/material changes and source metadata saves.

- Ten masters reopen with their expected collections, relative Garden links, roots, guide nodes and packed source images.
- A direct comparison to the entry masters preserves the authored Action curves, interpolation/handles, pivot transforms and camera guides.
- All 94 delivered GLBs are checked for required names, roots, materials, triangle caps, binary caps and clip declarations. All 94 are also imported into empty Blender sessions with their actual external textures.
- All 18 authored clips are retained across 36 animated variants. The motion check samples 1,210 transforms at five clip fractions; the existing acceptance threshold is 5 mm / 0.005 radians. Forward/reverse source seeking is also checked.
- The actual desktop and mobile compositions are checked independently at 5,760 rail/pose samples for 0.50 m camera clearance.
- The local scene triangle inventories remain below 160,000 desktop / 55,000 mobile. Whole-scene unbatched primitive counts are recorded, but are not a measured browser draw-call budget or frame-rate result.
- The source review set contains seven views per route: wide, primary, landmark, late-rail close, reverse, portrait mobile and a dedicated material detail. The material camera is a review camera; it does not replace a locked guide.
- Twenty desktop/mobile WebP posters are refreshed at 1600×1000 and 780×1200. Budget limits are 180 KiB and 110 KiB respectively.
- Actual GLBs were additionally assembled and rendered for Garden, Builder, Thinker, AURA and Future. This catches material/export differences that a source-only render cannot establish.
- All 169 website source files in the entry snapshot retain their hashes. Differences reported against the older 216-file historical baseline predate this pass and were preserved.

**Khronos result: zero errors, with 330 tangent-space portability warnings.** These are the validator's `MESH_PRIMITIVE_GENERATED_TANGENT_SPACE` advisories for normal-mapped primitives without exported tangents. They are retained in the report, not suppressed or reclassified. Normal detail relies on generated tangent space, so exact shading across target renderers remains a runtime acceptance item. The package is not a zero-warning delivery.

The old validator command lacked an external-image reader and initially reported image I/O errors. `senior_khronos.py` runs the installed Khronos validator with the actual relative shared-image files. Those configuration errors were resolved; they are not counted as asset defects in the final run.

The export pass also corrected two real appearance problems: constant shader tints lost during Blender's vertex-color export, and unused vertex tints incorrectly applied to leaf sprays. Tiling UVs use normalized 16-bit coordinates plus `KHR_texture_transform`; positions retain the existing `KHR_mesh_quantization` encoding. Material-wide constant vertex tints are factored into the material instead of repeated per vertex. Noncontract mesh datablock names and internal art-pass flags are omitted from the GLB; all required object/node names remain.

## Sources and licenses

The five external source assets are Poly Haven CC0 resources:

| Source | Creator | Use |
|---|---|---|
| [Tree Small 02](https://polyhaven.com/a/tree_small_02) | Rico Cilliers | Adapted trunk geometry, crown distributions, diffuse/opacity leaf spray. |
| [Bark Brown 02](https://polyhaven.com/a/bark_brown_02) | Rob Tuytel | Bark PBR maps. |
| [Mossy Rock](https://polyhaven.com/a/mossy_rock) | Rob Tuytel | Stone and courtyard surface detail. |
| [Forest Ground 04](https://polyhaven.com/a/forest_ground_04) | Rob Tuytel; Rico Cilliers | Recolored moss/earth PBR maps. |
| [Wood Planks Grey](https://polyhaven.com/a/wood_planks_grey) | Rob Tuytel | Recolored cedar PBR maps. |

[Poly Haven's license](https://polyhaven.com/license) permits commercial use, modification and redistribution under CC0. Provenance is recorded in `senior-provenance.json`, the master `READ_ME` blocks, and `public/models/stay/v1/shared/THIRD_PARTY_LICENSES.md`.

The 26 new shared texture files comprise 24 PBR JPG maps plus two foliage PNGs. Desktop PBR maps are 512 square; mobile maps are 256 square. Foliage is 256×512 desktop and 128×256 mobile. The `.blend` images are packed. The GLBs use relative shared-image URIs: copy the complete `public/models/stay/v1` tree, including `shared`, when moving the assets.

## Handoff locations and limits

- Masters, production tools and validation reports: `scripts/blender/stay-awhile/`
- 94 GLBs, ten scene manifests and asset manifest: `public/models/stay/v1/`
- Twenty published posters: `public/assets/stay/v1/`
- Source render review and actual-GLB renders: `.aura-work/senior-art-pass/review/` and `glb-review/`
- Recoverable entry assets: `.aura-work/senior-art-pass/baseline/`

The v2.0 Bible was read as the art-direction authority; its SHA-256 is `ec0ce6ca9574df3851917e8162b2cf5a68b132ba76b4f663ce75994f69056a4f`. The existing technical contract's original specification hash is retained, with the v2 art-direction hash recorded separately in the asset manifest and master notes.

Browser loading, draw calls, FPS, lifecycle, reduced-motion behavior and production route acceptance were not tested by this Blender-only pass. No Next.js, React, Three.js, TypeScript, JavaScript, CSS, HTML, UI, scroll or camera-runtime source was changed. No commit, merge or deployment was performed.
