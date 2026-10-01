# Stay Awhile runtime handoff — Phase 1

The development-only `/stay-asset-gate/` surface loaded and rendered all 94 final GLBs in the browser: 47 desktop and 47 mobile. It checked the ten scene manifests, expected node and guide names, materials and color attributes, 18 authored clips per variant, forward/reverse seeking, and mount/disposal. All 20 route-variant samples passed. No Blender export was changed. Production renders the route as the site's 404 page.

The Stay layout now owns one persistent Three renderer, an `AssetStore`, scene registration, measured native scroll progress, manifest camera sampling, a route adapter boundary, and poster/reading fallbacks. Used shared-kit assets are retained across Stay navigation; route-specific handles are released. Loading is concurrent, generation-checked, and reference-counted. Garden uses the package's G12 petal mesh for a runtime-owned instanced ambient channel after its third beat begins. Garden, Person, Builder, Thinker, and Leader use final desktop/mobile GLBs and semantic route content. The remaining five routes still use the previous native scene and content while retaining their independent URLs.

## Verified in this execution

- `npm run typecheck` and `npm run build` passed after the runtime and route changes. The optimized static export generated all ten Stay URLs.
- The served `out/` build loaded Garden, Person, Builder, and Thinker directly. Garden→Person→Garden and Thinker→Garden kept renderer ID 1; leaving for Quick removed the Stay canvas and host.
- Builder scroll moved the camera and sampled authored assembly forward and backward. At 390×844, Builder and Thinker selected mobile GLBs without horizontal overflow. Manual **Read without motion** released the canvas, retained the poster and complete DOM content, and could restore 3D.
- The map exposed real links to all ten destinations. Direct map travel focused the committed page's h1 after closing the dialog. Fresh production-browser checks reported no console errors or warnings. Quick and Landing loaded in the production build without observed console errors.

## Still required before full specification acceptance

- Complete Stories, Work, Future, AURA, and Contact through the shared runtime in that order. The existing native pages remain available during migration.
- Complete the Person certificate dialog, Work's five station case studies/demos and progressive station loading, Stories disclosures, AURA runtime connection reveal, and the remaining route-specific ambient/interaction channels.
- Expand route transition timing and readiness handoff, adaptive quality tiers, source-centered Stay content records, and authored typography enhancement. Current map travel and first four route visuals are foundations, not final acceptance.
- Run the specification's full responsive, OS reduced-motion, keyboard/screen-reader, failure-injection, 20-cycle resource, and named-device performance tests. Browser viewport checks are emulation, not physical-device evidence.
- `npm run lint` currently stops before source linting because the existing ESLint configuration names `jsx-a11y/no-noninteractive-element-interactions` while the plugin is not installed. The shared lint setup was left unchanged to preserve scope.

Pre-existing changes in the four Quick Discovery files were present before this work and were not edited here. Landing, Blender masters, and exports were not changed.
