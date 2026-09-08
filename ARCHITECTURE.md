# AURA implementation boundaries

Next App Router renders static HTML for three routes. Client boundaries attach the experience runtimes. This refinement adds no dependencies and preserves the existing lockfile.

## Choreography

Quick has eleven scroll tracks: Entry, Who, Build, Work title card, Study Planner, Past Paper Analytics, STRAT MUN, AURA, Beyond, Future and Contact. Original track heights define the timing. Do not reorder stages or replace their scroll windows when editing copy.

The engine preserves seeded shards, network nodes, planner blocks, graph points, committee nodes, wireframes, embers and stars. It caches DOM references and stage bounds. Resize and font readiness refresh measurements. Hidden tabs stop their loops; reduced-motion rendering paints settled states on demand. Cleanup prevents duplicate primitives and listeners after route restoration.

Interpolation smooths network colours, task settling glow, graph point colours and the typed-title caret. Embers use elapsed frame time. Beyond retains four depth layers and their timing, with reduced travel on phones and space for real text.

## Entry handoff

`entry/morph.ts` intercepts ordinary Quick clicks; modified clicks retain normal link behavior. One temporary inert crystal copies the existing material and shape, travels from measured entrance bounds to the opening monolith, and loses its inscription as surrounding geometry converges. Quick is prefetched and routed underneath. Handoff waits for Quick readiness. The overlay cleans up on completion, interruption, cancellation or timeout. Reduced motion uses normal navigation.

## Navigation

`quick-discovery/navigation.ts` owns chapter clicks. Duration is `min(4600, 650 + sqrt(distance / viewportHeight) * 600)` milliseconds, using smoothstep. Scene progress itself is never smoothed. Wheel, touch, pointer and scrolling keys cancel navigation travel.

Arrival writes the chapter hash and focuses the destination without another scroll. Native hash entry settles into the opening; restored interior positions remain intact. Quick disables global CSS smooth scrolling so it cannot compete with history restoration or the explicit controller.

The engine derives aria-current from the section containing the viewport reading point. The four projects all map to WORK. The home mark and deeper destinations remain real links.

## Responsive reading

The CSS module owns typography and layout. Serif and monospaced fonts remain unchanged. Diagram coordinates keep their authored frame sizes and scale to fit. Essential explanatory text stays outside small diagrams or compensates for scaling.

`QuickReadingStyles.tsx` makes the same DOM ordinary document flow only for the explicit reduced-motion preference or disabled JavaScript. No viewport-width, viewport-height or font-size threshold disables the cinematic runtime. Semantic copy remains accessible to screen readers throughout the animation.

## Content and evidence

`content.ts`, `projects.ts` and `site.ts` own copy and destinations. The past-paper logger is distinct from the topic-filtered compilation concept. No scores, attendance figures, awards, external links or certificate images are manufactured.

Stay Awhile remains the existing editorial destination. This refinement connects four real project anchors; it does not claim to create separate interactive case-study applications.

## Delivery

Next exports to `out/`. `.openai/hosting.json` identifies the existing Sites project and output directory. Input documents, local screenshots and backups live in the ignored `.aura-work/` directory and are not packaged.
