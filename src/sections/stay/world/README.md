# Stay Awhile runtime and narrative

All ten Stay routes use the finished desktop/mobile Blender package through one persistent Three renderer. Landing, Quick Discovery, Blender masters, published models, textures and posters are outside this pass. Existing unrelated dirty work is preserved.

## Ownership

- `StayExperienceProvider`, `SceneBoundary` and `StayWorldHost` connect semantic route content to the persistent world. Server-rendered text and native scroll remain authoritative. Quiet reading, reduced motion, unavailable WebGL and failed assets retain the poster and complete narrative.
- `ScrollController` measures the actual native beat layout. `narrative-score`, `CameraController` and `CinematicTextController` use that reversible score for continuous camera position/look framing, reading holds and whole-phrase masks. Fast jumps, focus and narrow viewports expose text immediately. Only `WorldRuntime` owns a recurring animation frame.
- `AssetStore` deduplicates variant loads and reference-counts their ownership. Shared garden handles are bounded; outgoing route handles release after a prepared incoming route commits. Generation checks prevent late work from replacing a newer destination. Work stations load progressively and use the same cancellation contract.
- Shader preparation and bounded texture uploads happen before the incoming world appears. Camera/mixer evaluation is cached during stationary reading. Instrumentation reports frame intervals, CPU submission cost, calls, triangles, estimated texture bytes, load/parse times, preparation times and resource counts. These are diagnostics, not a browser performance trace or an exact GPU memory measurement.
- `PetalSystem` samples actual canopy geometry and instances the delivered G12 mesh. Counts, scale, deterministic motion and pointer influence are bounded. Contact has no petals or canopy sway. Hidden worlds stop scheduling; paused ambient motion still permits native input to settle. `WaterSurface` adds a small desktop reflection to the authored Thinker pond; mobile uses the authored water.
- `core-narrative` and `onward-narrative` contain source-backed editorial copy. `NarrativeRoute` emits semantic headings, paragraphs, disclosures and real links. `ProjectArtifacts` contains explicitly illustrative demonstrations. `NARRATIVE_SOURCES.md` records provenance, uncertainty and private-material boundaries.

## Navigation and fallbacks

The map uses a native dialog, real destination links, overhead camera lift, cancellable path travel, arrival focus and Escape restoration. Reduced-motion and manual quiet travel commit directly. Native no-JS atlas links remain available. Existing Garden project-hash compatibility remains in `StayShell`.

## Current validation

The 2026-10-01 quality pass has a production export, typecheck/lint, score tests, lifecycle fixtures and a browser review under `.codex-tmp/stay-quality/`. Its `QUALITY_REPORT.md` separates actual browser observations from fixture tests and records the remaining acceptance gates. Earlier Phase 1 reports do not establish acceptance of this implementation. The site has not been deployed in this pass.
