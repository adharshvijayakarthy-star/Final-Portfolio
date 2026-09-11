# Stay Awhile — native Garden foundation

Phase 1 implements only `/stay/`. The immutable reference is
`claude-stay-import/Finish animations and deck conversion/`.

## Ownership

- `GardenContent.tsx` contains the reference Garden entry copy and composition.
- `reference.module.css` contains its translated, scoped presentation.
- `GardenScene.tsx` renders authored SVG geometry as native React elements.
- `garden-geometry.json` contains only the reference Garden composition, including
  seeded silhouettes, colors, layer depth and reveal order. It was evaluated once
  during the port; no Claude template evaluator ships with the application.
- `garden-controller.ts` owns the Garden arrival, parallax and canvas atmosphere.
  Its disposer removes listeners and cancels every owned animation frame. It uses
  no timers. Reduced-motion changes are handled while the page is open.
- `GardenNav.tsx` and `GardenMap.tsx` implement the shared navigation concept.
  `map-geometry.json` and `map-nodes.json` retain the reference overhead drawing.
- `destinations.ts` prepares the ten route names. Only Garden is available.
- `StayShell.tsx` owns the native boundary and existing project-anchor compatibility.
- `stay.module.css` scopes shell, scene and map presentation. The separate
  `stay-keyframes.css` defines only uniquely prefixed animation names; it has no
  element selectors. Existing global styles and tokens are not modified.
- EB Garamond is self-hosted through Next's font loader in the Stay route group.

## Deliberate differences from the reference

- Future destinations are visible but unavailable, rather than linking to missing
  pages. Cross-destination map travel and departure choreography are deferred until
  another native destination is approved. The overhead lift remains implemented.
- The map uses a native modal dialog for keyboard containment and restores focus.
- The existing root skip link supplies the main landmark, avoiding a duplicate.
- An oversized decorative arrival glow is clipped to prevent horizontal overflow.
- Reduced motion stops all Stay animations, including the map pulse. Hidden-tab
  atmosphere rendering is suspended. Random petal positions remain variable.
- Existing `/stay/#study-planner`, `#past-paper-logger`, `#mun-club` and
  `#project-aura` links display the unchanged editorial Stay component. This is
  compatibility, not a port of the Claude Work destination.
- Map travel instructions are replaced with an availability notice for this phase.

## Verification performed

Production build passed; no additional destination routes were generated. Native
and reference arrival/scroll/map screenshots were compared in Edge. At 1440×1000,
the title's measured position and dimensions matched exactly. Scroll/parallax,
ambient animation, map opening, Escape, focus restoration, reduced motion and
390px-width rendering were exercised. Repeated native mount/unmount cycles showed
stable listener counts and no persistent owned frame loop after unmount.

Normal Stay → Quick → browser Back was verified. Quick retained its normal body
font/background after client navigation. Existing project anchors worked. The
Blender prototype still rendered its 60-mesh GLB and the asset returned HTTP 200.
Protected reference, Quick, entry, shared styles/data and Blender source/assets
matched their pre-port SHA-256 hashes. No dependencies were added in this phase.

This phase was not deployed. No other destination or Blender integration is included.
