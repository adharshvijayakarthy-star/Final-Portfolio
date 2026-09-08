# Project AURA

Adharsh Vijayakarthy’s portfolio, refined from the approved Claude implementation.

- `/` — crystal and garden entrance, with a crystal morph into Quick Discovery.
- `/quick/` — the original eleven cinematic scroll stages and six chapter links.
# Final-Portfolio

## Editing the words

| File | Edit here |
| --- | --- |
| `src/data/content.ts` | Name, roles, biography, chapters, Build, AURA story, achievements, future, contacts and shared routes |
| `src/data/projects.ts` | Projects, narration beats, details, metadata and deeper links |
| `src/data/site.ts` | Site metadata and entrance labels |

Replace `YOUR_EMAIL`, `YOUR_LINKEDIN`, `YOUR_GITHUB` and `YOUR_PHONE` in `content.ts`. Email and phone become mailto and tel links; LinkedIn and GitHub require full HTTPS URLs. Unfilled values remain visible without broken links.

Project screenshots and certificate scans can be added through the typed asset fields. Until real images are supplied, the original frames contain factual text. The paper chart is illustrative and displays no actual scores.

The deeper links lead to `/stay/#study-planner`, `/stay/#past-paper-logger`, `/stay/#strat-mun` and `/stay/#project-aura`. External demos, repositories and certificate images have not been invented.

## Local development

Use Node 20.9 or later. Run `npm install`, then `npm run dev`.

- `npm run check` — TypeScript and ESLint.
- `npm run build` — production static export into `out/`.

Serve `out/` with a static server that resolves directories to `index.html`. This is a Next static export; `next start` is not the preview command for that output.

## Motion and accessibility

`src/sections/quick-discovery/engine.ts` retains the approved seeds, scene clocks, cameras and major choreography. `navigation.ts` owns chapter scrolling separately. `src/sections/entry/morph.ts` carries the existing crystal into Quick’s matching monolith.

Only the explicit reduced-motion preference or disabled JavaScript selects the readable document. Viewport size and enlarged text never disable animation. Desktop remains the primary cinematic composition. Wheel and touch scrolling stay native and interrupt navigation travel.

See `REFINEMENT_REPORT.md` for verification and `ARCHITECTURE.md` for implementation boundaries. The pre-refinement source and browser evidence remain in the ignored `.aura-work/` directory, outside the published site.
